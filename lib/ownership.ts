import { prisma } from "./prisma";

export async function getOwnedProfile(userId: string, profileId: string) {
  return prisma.voiceProfile.findFirst({
    where: { id: profileId, userId },
  });
}

export async function getOwnedDocument(userId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, userId },
  });
}

export async function getOwnedGlossary(userId: string, glossaryId: string) {
  return prisma.glossary.findFirst({
    where: { id: glossaryId, userId },
  });
}

export async function listUserProfiles(userId: string) {
  return prisma.voiceProfile.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listUserDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}