import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IdentifyResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export async function identifyContactService(
  email: string | null,
  phoneNumber: string | null
): Promise<IdentifyResponse> {
  
  // Step 1: Find existing contacts matching email OR phone
  const existingContacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : {},
        phoneNumber ? { phoneNumber } : {}
      ].filter(condition => Object.keys(condition).length > 0),
      deletedAt: null
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Step 2: No existing contacts - create new primary
  if (existingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'primary'
      }
    });

    return buildResponse([newContact]);
  }

  // Step 3: Get all primary contacts from matches
  const primaryContactIds = new Set<number>();
  
  for (const contact of existingContacts) {
    if (contact.linkPrecedence === 'primary') {
      primaryContactIds.add(contact.id);
    } else if (contact.linkedId) {
      primaryContactIds.add(contact.linkedId);
    }
  }

  const primariesArray = Array.from(primaryContactIds);

  // Step 4: Handle multiple primary chains - merge them
  if (primariesArray.length > 1) {
    // Sort by createdAt to find oldest
    const allPrimaries = await prisma.contact.findMany({
      where: {
        id: { in: primariesArray }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const oldestPrimary = allPrimaries[0];
    const primariesToConvert = allPrimaries.slice(1);

    // Convert newer primaries to secondaries
    for (const primary of primariesToConvert) {
      await prisma.contact.update({
        where: { id: primary.id },
        data: {
          linkedId: oldestPrimary.id,
          linkPrecedence: 'secondary',
          updatedAt: new Date()
        }
      });

      // Also update all contacts linked to this old primary
      await prisma.contact.updateMany({
        where: { linkedId: primary.id },
        data: { linkedId: oldestPrimary.id }
      });
    }
  }

  // Step 5: Determine if we need to create a new secondary contact
  const primaryId = primariesArray[0];
  
  // Check if this exact combination exists
  const exactMatch = existingContacts.find(
    c => c.email === email && c.phoneNumber === phoneNumber
  );

  if (!exactMatch) {
    // Check if we have new information
    const hasNewEmail = email && !existingContacts.some(c => c.email === email);
    const hasNewPhone = phoneNumber && !existingContacts.some(c => c.phoneNumber === phoneNumber);

    if (hasNewEmail || hasNewPhone) {
      // Create new secondary contact
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: primaryId,
          linkPrecedence: 'secondary'
        }
      });
    }
  }

  // Step 6: Get all contacts in the chain
  const allLinkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryId },
        { linkedId: primaryId }
      ],
      deletedAt: null
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return buildResponse(allLinkedContacts);
}

function buildResponse(contacts: any[]): IdentifyResponse {
  const primary = contacts.find(c => c.linkPrecedence === 'primary') || contacts[0];
  const secondaries = contacts.filter(c => c.id !== primary.id);

  // Collect unique emails (primary's email first)
  const emails: string[] = [];
  if (primary.email) emails.push(primary.email);
  
  for (const contact of secondaries) {
    if (contact.email && !emails.includes(contact.email)) {
      emails.push(contact.email);
    }
  }

  // Collect unique phone numbers (primary's phone first)
  const phoneNumbers: string[] = [];
  if (primary.phoneNumber) phoneNumbers.push(primary.phoneNumber);
  
  for (const contact of secondaries) {
    if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
      phoneNumbers.push(contact.phoneNumber);
    }
  }

  return {
    contact: {
      primaryContatctId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaries.map(c => c.id)
    }
  };
}
