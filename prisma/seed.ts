import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting GrowthMantra AI database seeding...");

  // 1. Roles
  const rolesData = [
    { id: "super_admin", name: "Super Admin", description: "Entire platform oversight, tenants, plans, and platform settings" },
    { id: "agency_admin", name: "Agency Admin", description: "Agency management across authorized client tenants" },
    { id: "preschool_owner", name: "Preschool Owner", description: "Own tenant owner, director, admissions, approvals, and team" },
    { id: "branch_manager", name: "Branch Manager", description: "Branch-scoped enquiries, counsellor assignment, and branch approvals" },
    { id: "admission_counsellor", name: "Admission Counsellor", description: "Assigned leads, parent calls, campus visits, and admissions" },
    { id: "content_reviewer", name: "Content Reviewer", description: "Review, edit, approve, reject and request content changes" },
  ];

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: role,
      create: role,
    });
  }

  // 2. Permissions
  const permissionsData = [
    { id: "tenants.manage", module: "tenants", description: "Create and manage tenants and plans" },
    { id: "branches.manage", module: "branches", description: "Manage preschool branches and operational settings" },
    { id: "leads.view", module: "crm", description: "View admission leads and enquiries" },
    { id: "leads.create", module: "crm", description: "Create new admission leads manually or from web forms" },
    { id: "leads.edit", module: "crm", description: "Update lead status, notes, and visit outcomes" },
    { id: "leads.export", module: "crm", description: "Export lead records with authorization check" },
    { id: "facts.manage", module: "knowledge_base", description: "Manage and verify preschool facts" },
    { id: "content.generate", module: "content", description: "Generate AI content drafts" },
    { id: "content.approve", module: "approvals", description: "Approve or reject content for publishing" },
    { id: "whatsapp.inbox", module: "whatsapp", description: "Read and reply to WhatsApp parent conversations" },
    { id: "reports.view", module: "reports", description: "View conversion funnels and branch reports" },
    { id: "audit.view", module: "audit", description: "View security and compliance audit logs" },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: perm,
      create: perm,
    });
  }

  // 3. Super Admin User
  const superAdminPassword = await bcrypt.hash("SuperAdmin2026!", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@growthmantra.ai" },
    update: { passwordHash: superAdminPassword, fullName: "GrowthMantra SuperAdmin", isSuperAdmin: true },
    create: {
      email: "admin@growthmantra.ai",
      passwordHash: superAdminPassword,
      fullName: "GrowthMantra SuperAdmin",
      phone: "+919999000000",
      isSuperAdmin: true,
      status: "active",
    },
  });

  // 4. Demo Tenant: Bright Star Preschool
  const tenant = await prisma.tenant.upsert({
    where: { slug: "bright-star" },
    update: {},
    create: {
      name: "Bright Star Preschool",
      slug: "bright-star",
      legalName: "Bright Star Early Education Pvt Ltd",
      websiteUrl: "https://brightstarpreschool.example.com",
      timezone: "Asia/Kolkata",
      planTier: "growth",
      status: "active",
    },
  });

  // 5. Branches for Bright Star Preschool
  const noidaBranch = await prisma.branch.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: "noida-sec-62" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Bright Star - Noida Sector 62",
      slug: "noida-sec-62",
      addressLine1: "B-12, Sector 62",
      city: "Noida",
      state: "Uttar Pradesh",
      postalCode: "201309",
      phone: "+919811223344",
      email: "noida@brightstarpreschool.com",
      status: "active",
    },
  });

  const indirapuramBranch = await prisma.branch.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: "indirapuram" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Bright Star - Indirapuram",
      slug: "indirapuram",
      addressLine1: "Plot 45, Nyay Khand 1",
      city: "Ghaziabad",
      state: "Uttar Pradesh",
      postalCode: "201014",
      phone: "+919811223355",
      email: "indirapuram@brightstarpreschool.com",
      status: "active",
    },
  });

  // 6. Tenant Users
  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // Preschool Owner / Director
  const owner = await prisma.user.upsert({
    where: { email: "director@brightstarpreschool.com" },
    update: {},
    create: {
      email: "director@brightstarpreschool.com",
      passwordHash: defaultPassword,
      fullName: "Pooja Sharma",
      phone: "+919811000001",
      status: "active",
    },
  });
  const ownerTenantUser = await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
    update: {},
    create: { tenantId: tenant.id, userId: owner.id, roleId: "preschool_owner", status: "active" },
  });

  // Branch Manager (Noida)
  const branchManager = await prisma.user.upsert({
    where: { email: "bm.noida@brightstarpreschool.com" },
    update: {},
    create: {
      email: "bm.noida@brightstarpreschool.com",
      passwordHash: defaultPassword,
      fullName: "Vikram Mehta",
      phone: "+919811000002",
      status: "active",
    },
  });
  const bmTenantUser = await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: branchManager.id } },
    update: {},
    create: { tenantId: tenant.id, userId: branchManager.id, roleId: "branch_manager", status: "active" },
  });
  await prisma.branchUser.upsert({
    where: { branchId_tenantUserId: { branchId: noidaBranch.id, tenantUserId: bmTenantUser.id } },
    update: {},
    create: { branchId: noidaBranch.id, tenantUserId: bmTenantUser.id },
  });

  // Admission Counsellor
  const counsellor = await prisma.user.upsert({
    where: { email: "counsellor@brightstarpreschool.com" },
    update: {},
    create: {
      email: "counsellor@brightstarpreschool.com",
      passwordHash: defaultPassword,
      fullName: "Ananya Sen",
      phone: "+919811000003",
      status: "active",
    },
  });
  const counsellorTenantUser = await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: counsellor.id } },
    update: {},
    create: { tenantId: tenant.id, userId: counsellor.id, roleId: "admission_counsellor", status: "active" },
  });
  await prisma.branchUser.upsert({
    where: { branchId_tenantUserId: { branchId: noidaBranch.id, tenantUserId: counsellorTenantUser.id } },
    update: {},
    create: { branchId: noidaBranch.id, tenantUserId: counsellorTenantUser.id },
  });

  // Content Reviewer
  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@brightstarpreschool.com" },
    update: {},
    create: {
      email: "reviewer@brightstarpreschool.com",
      passwordHash: defaultPassword,
      fullName: "Rohit Saxena",
      phone: "+919811000004",
      status: "active",
    },
  });
  await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: reviewer.id } },
    update: {},
    create: { tenantId: tenant.id, userId: reviewer.id, roleId: "content_reviewer", status: "active" },
  });

  // 7. Verified Preschool Facts (Knowledge Base)
  const facts = [
    {
      category: "curriculum",
      factKey: "curriculum_philosophy",
      factValue: "Holistic inquiry-based learning blending play, early phonics, and hands-on sensory exploration.",
      verificationSource: "Curriculum Guide 2026",
    },
    {
      category: "timings",
      factKey: "operational_hours",
      factValue: "Playgroup: 09:00 AM - 12:00 PM | Nursery: 09:00 AM - 01:00 PM | Daycare: 08:30 AM - 06:30 PM (Mon-Fri)",
      verificationSource: "Handbook 2026",
    },
    {
      category: "facilities",
      factKey: "campus_amenities",
      factValue: "CCTV surveillance with live parent access during visiting hours, pediatric first aid room, temperature-controlled classrooms, child-safe splash pool.",
      verificationSource: "Campus Audit 2026",
    },
    {
      category: "safety",
      factKey: "child_safety_protocol",
      factValue: "100% police-verified staff, female attendants on all floors, biometric parent pickup cards, hourly sanitation.",
      verificationSource: "Safety Policy v2.1",
    },
    {
      category: "admissions",
      factKey: "age_criteria",
      factValue: "Playgroup (2-3 years), Nursery (3-4 years), KG-1 (4-5 years), Daycare (1-6 years). Rolling admissions open for current and upcoming term.",
      verificationSource: "Admission Office 2026",
    },
    {
      category: "brand_tone",
      factKey: "tone_and_voice",
      factValue: "Warm, reassuring, professional, child-centric. Emphasize emotional security, discovery, and qualified educators. Never invent unverified fee discounts.",
      verificationSource: "Director Pooja Sharma",
    },
  ];

  for (const fact of facts) {
    const existing = await prisma.businessFact.findFirst({
      where: {
        tenantId: tenant.id,
        branchId: null,
        factKey: fact.factKey,
      },
    });

    if (!existing) {
      await prisma.businessFact.create({
        data: {
          tenantId: tenant.id,
          category: fact.category,
          factKey: fact.factKey,
          factValue: fact.factValue,
          verificationSource: fact.verificationSource,
          isVerified: true,
          verifiedById: owner.id,
          verifiedAt: new Date(),
        },
      });
    }
  }

  // 8. Demo Contacts & Admission Leads
  const demoContacts = [
    {
      name: "Rahul Verma",
      phone: "+919810011223",
      email: "rahul.verma@example.com",
      childName: "Aarav Verma",
      childAge: "playgroup_2_3",
      stage: "visit_scheduled",
      source: "whatsapp",
      branchId: noidaBranch.id,
      notes: "Parent inquired via WhatsApp about campus safety. Campus visit scheduled for Thursday 10:30 AM.",
      visitDate: new Date(Date.now() + 86400000 * 2),
    },
    {
      name: "Megha Gupta",
      phone: "+919810022334",
      email: "megha.g@example.com",
      childName: "Anaya Gupta",
      childAge: "toddler_1_2",
      stage: "new_enquiry",
      source: "google_business",
      branchId: noidaBranch.id,
      notes: "Clicked GBP call button. Interested in Daycare + Playgroup combo.",
      visitDate: null,
    },
    {
      name: "Sandeep Rao",
      phone: "+919810033445",
      email: "sandeep.rao@example.com",
      childName: "Vivaan Rao",
      childAge: "nursery_3_4",
      stage: "converted",
      source: "walk_in",
      branchId: indirapuramBranch.id,
      notes: "Completed campus visit on Monday. Form submitted and admission fee cleared.",
      visitDate: new Date(Date.now() - 86400000 * 3),
    },
    {
      name: "Priyanka Joshi",
      phone: "+919810044556",
      email: "priyanka.j@example.com",
      childName: "Rhea Joshi",
      childAge: "playgroup_2_3",
      stage: "contacted",
      source: "website",
      branchId: noidaBranch.id,
      notes: "Left enquiry on website form. First follow-up call completed; requested fee brochure.",
      visitDate: null,
    },
    {
      name: "Kunal Kapoor",
      phone: "+919810055667",
      email: "kunal.kapoor@example.com",
      childName: "Samar Kapoor",
      childAge: "kg_4_6",
      stage: "interested",
      source: "referral",
      branchId: indirapuramBranch.id,
      notes: "Referred by parent of alumni. Very interested in KG-1 curriculum.",
      visitDate: null,
    },
  ];

  for (const c of demoContacts) {
    const contact = await prisma.contact.upsert({
      where: {
        tenantId_normalizedPhone: {
          tenantId: tenant.id,
          normalizedPhone: c.phone,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        fullName: c.name,
        normalizedPhone: c.phone,
        email: c.email,
        whatsappOptIn: true,
        optInSource: c.source,
        optInTimestamp: new Date(),
      },
    });

    const existingLead = await prisma.lead.findFirst({
      where: {
        tenantId: tenant.id,
        contactId: contact.id,
      },
    });

    if (!existingLead) {
      const lead = await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          branchId: c.branchId,
          contactId: contact.id,
          childName: c.childName,
          childAgeBand: c.childAge,
          source: c.source,
          pipelineStage: c.stage,
          assignedCounsellorId: counsellor.id,
          visitScheduledAt: c.visitDate,
          admissionConvertedAt: c.stage === "converted" ? new Date() : null,
          notes: c.notes,
        },
      });

      // Create initial activity
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          actorId: counsellor.id,
          activityType: "stage_change",
          metadata: JSON.stringify({ toStage: c.stage, source: c.source }),
        },
      });
    }
  }

  // 9. Demo Content Items & Approvals
  const existingPost = await prisma.contentItem.findFirst({
    where: { tenantId: tenant.id, title: "Playgroup Admissions Open 2026-27" },
  });

  if (!existingPost) {
    const contentPost = await prisma.contentItem.create({
      data: {
        tenantId: tenant.id,
        branchId: noidaBranch.id,
        channel: "google_business_profile",
        contentType: "post",
        title: "Playgroup Admissions Open 2026-27",
        currentStatus: "pending_approval",
        createdById: counsellor.id,
      },
    });

    const version1 = await prisma.contentVersion.create({
      data: {
        contentItemId: contentPost.id,
        versionNumber: 1,
        headline: "Give Your Child a Nurturing Start at Bright Star Sector 62!",
        bodyText: "Admissions are now open for Playgroup (ages 2–3) and Nursery. Our campus features CCTV monitoring, trained educators, and experiential play-based learning. Limited to 15 children per batch.",
        callToAction: "Book a Campus Tour",
        targetUrl: "https://brightstarpreschool.example.com/admissions",
        createdById: counsellor.id,
      },
    });

    await prisma.approval.create({
      data: {
        tenantId: tenant.id,
        contentItemId: contentPost.id,
        contentVersionId: version1.id,
        status: "pending_approval",
        requestedById: counsellor.id,
        scheduledFor: new Date(Date.now() + 86400000 * 3),
      },
    });
  }

  // 10. Integrations (Foundations in Disconnected State as required)
  await prisma.integration.upsert({
    where: { tenantId_provider: { tenantId: tenant.id, provider: "google_business_profile" } },
    update: {},
    create: {
      tenantId: tenant.id,
      provider: "google_business_profile",
      status: "not_connected",
    },
  });

  await prisma.integration.upsert({
    where: { tenantId_provider: { tenantId: tenant.id, provider: "meta_whatsapp" } },
    update: {},
    create: {
      tenantId: tenant.id,
      provider: "meta_whatsapp",
      status: "not_connected",
    },
  });

  // 11. Google Business Profile Reviews
  const demoReviews = [
    {
      authorName: "Anita Roy",
      starRating: 5,
      comment: "Wonderful preschool in Sector 62! The splash pool, child-safe sensory gym and loving teachers make learning so joyous for Aarav.",
      replyText: "Dear Anita, thank you so much for your kind words! We are delighted to see Aarav thrive in our sensory play gym and splash pool sessions.",
      replyStatus: "published",
      branchId: noidaBranch.id,
    },
    {
      authorName: "Deepak Sharma",
      starRating: 5,
      comment: "Very safe and transparent environment. As working parents, the CCTV monitoring and verified attendants give us complete peace of mind.",
      replyText: "Thank you Deepak! Child safety, CCTV transparency, and police-verified staff remain our non-negotiable priority.",
      replyStatus: "approved",
      branchId: noidaBranch.id,
    },
    {
      authorName: "Neha Kapur",
      starRating: 4,
      comment: "Great curriculum and caring staff for Playgroup. Would appreciate smoother traffic coordination during 12 PM pickup.",
      replyText: "Thank you for the valuable feedback Neha! We are deploying an additional security marshall during pickup hours to ease lane congestion.",
      replyStatus: "drafted",
      branchId: noidaBranch.id,
    },
  ];

  for (const r of demoReviews) {
    const existing = await prisma.gbpReview.findFirst({
      where: { tenantId: tenant.id, branchId: r.branchId, authorName: r.authorName },
    });
    if (!existing) {
      await prisma.gbpReview.create({
        data: {
          tenantId: tenant.id,
          branchId: r.branchId,
          authorName: r.authorName,
          starRating: r.starRating,
          comment: r.comment,
          replyText: r.replyText,
          replyStatus: r.replyStatus,
        },
      });
    }
  }

  // 12. Local SEO Keywords
  const demoKeywords = [
    { keyword: "best playgroup in sector 62 noida", intent: "local_near_me", vol: 480, diff: 24, rank: 3, branchId: noidaBranch.id },
    { keyword: "preschool admissions in noida", intent: "admissions_open", vol: 850, diff: 38, rank: 4, branchId: noidaBranch.id },
    { keyword: "daycare near sector 62 noida", intent: "program_specific", vol: 320, diff: 19, rank: 2, branchId: noidaBranch.id },
    { keyword: "best preschool in indirapuram ghaziabad", intent: "local_near_me", vol: 720, diff: 31, rank: 2, branchId: indirapuramBranch.id },
    { keyword: "nursery admission indirapuram", intent: "admissions_open", vol: 540, diff: 28, rank: 3, branchId: indirapuramBranch.id },
  ];

  for (const k of demoKeywords) {
    await prisma.localSeoKeyword.upsert({
      where: {
        branchId_keyword: { branchId: k.branchId, keyword: k.keyword },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        branchId: k.branchId,
        keyword: k.keyword,
        searchIntent: k.intent,
        monthlySearchVolumeEst: k.vol,
        difficultyScore: k.diff,
        currentRankEst: k.rank,
      },
    });
  }

  // 13. Approved WhatsApp Message Templates
  const demoTemplates = [
    {
      templateName: "admission_enquiry_ack",
      category: "UTILITY",
      headerText: "Welcome to Bright Star Preschool",
      bodyText: "Hello {{1}}, thank you for reaching out to {{2}}. We have received your enquiry for {{3}}. Would you like to schedule a campus tour this week?",
      footerText: "Reply STOP to opt out",
    },
    {
      templateName: "campus_tour_invitation",
      category: "UTILITY",
      headerText: "Campus Tour Confirmed",
      bodyText: "Dear {{1}}, we look forward to welcoming you and {{2}} to {{3}} on {{4}}. Our counselors will walk you through our learning spaces.",
      footerText: "Reply STOP to opt out",
    },
    {
      templateName: "fee_structure_notice",
      category: "MARKETING",
      headerText: "Fee Handbook 2026-27",
      bodyText: "Dear {{1}}, here are the verified program details and fee guidelines for {{2}} at {{3}}.",
      footerText: "Reply STOP to opt out",
    },
  ];

  for (const t of demoTemplates) {
    await prisma.messageTemplate.upsert({
      where: {
        tenantId_templateName_language: {
          tenantId: tenant.id,
          templateName: t.templateName,
          language: "en",
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        templateName: t.templateName,
        language: "en",
        category: t.category,
        headerText: t.headerText,
        bodyText: t.bodyText,
        footerText: t.footerText,
        metaStatus: "APPROVED",
      },
    });
  }

  // 14. Demo WhatsApp Conversations & Messages
  const rahulContact = await prisma.contact.findUnique({
    where: { tenantId_normalizedPhone: { tenantId: tenant.id, normalizedPhone: "+919810011223" } },
  });

  if (rahulContact) {
    const convo1 = await prisma.conversation.upsert({
      where: {
        tenantId_contactId: { tenantId: tenant.id, contactId: rahulContact.id },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        branchId: noidaBranch.id,
        contactId: rahulContact.id,
        assignedUserId: counsellor.id,
        lastMessageAt: new Date(),
        status: "open",
      },
    });

    const msgCount = await prisma.message.count({ where: { conversationId: convo1.id } });
    if (msgCount === 0) {
      await prisma.message.create({
        data: {
          conversationId: convo1.id,
          direction: "inbound",
          senderType: "contact",
          body: "Hello, I wanted to inquire about playgroup admissions for next term.",
          providerMessageId: "wamid.inbound.001",
          deliveryStatus: "delivered",
        },
      });

      await prisma.message.create({
        data: {
          conversationId: convo1.id,
          direction: "outbound",
          senderType: "user",
          senderId: counsellor.id,
          body: "Hello Mr. Verma! Admissions for Playgroup (ages 2–3) are currently open. Would you like to schedule a campus tour this week?",
          providerMessageId: "wamid.outbound.002",
          deliveryStatus: "read",
        },
      });

      await prisma.message.create({
        data: {
          conversationId: convo1.id,
          direction: "inbound",
          senderType: "contact",
          body: "Thank you for the campus tour details. What time should we arrive?",
          providerMessageId: "wamid.inbound.003",
          deliveryStatus: "delivered",
        },
      });
    }
  }

  console.log("✅ GrowthMantra AI database seeding complete!");
  console.log("🔑 Demo Accounts:");
  console.log("   • Super Admin: admin@growthmantra.ai / SuperAdmin2026!");
  console.log("   • Director/Owner: director@brightstarpreschool.com / Password123!");
  console.log("   • Branch Manager (Noida): bm.noida@brightstarpreschool.com / Password123!");
  console.log("   • Admission Counsellor: counsellor@brightstarpreschool.com / Password123!");
  console.log("   • Content Reviewer: reviewer@brightstarpreschool.com / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
