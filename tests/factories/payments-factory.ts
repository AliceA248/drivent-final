import faker from '@faker-js/faker';
import { prisma } from '@/config';

export async function createPayment(ticketId: number, value: number) {
  const paymentData = {
    ticketId,
    value,
    cardIssuer: faker.name.findName(),
    cardLastDigits: faker.random.number({ min: 1000, max: 9999 }).toString(),
  };

  return prisma.payment.create({ data: paymentData });
}

export function generateDataOfCreditCard() {
  const futureDate = faker.date.future();

  return {
    issuer: faker.name.findName(),
    number: faker.random.number({ min: 100000000000000, max: 999999999999999 }).toString(),
    name: faker.name.findName(),
    expirationDate: `${futureDate.getMonth() + 1}/${futureDate.getFullYear()}`,
    cvv: faker.random.number({ min: 100, max: 999 }).toString(),
  };
}
