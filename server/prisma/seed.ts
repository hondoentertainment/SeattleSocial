import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.savedEvent.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const passwordHash = await bcrypt.hash('password123', 12);

  const [alice, bob, charlie] = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-alice',
        email: 'alice@example.com',
        password: passwordHash,
        displayName: 'Alice Chen',
        avatarUrl: 'https://i.pravatar.cc/150?u=alice',
        bio: 'Seattle native. Tech, food, and live music enthusiast.',
        membershipTier: 'PREMIUM_PLUS',
        membershipExpiresAt: new Date('2027-01-01'),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-bob',
        email: 'bob@example.com',
        password: passwordHash,
        displayName: 'Bob Martinez',
        avatarUrl: 'https://i.pravatar.cc/150?u=bob',
        bio: 'Ballard resident. Craft beer and hiking.',
        membershipTier: 'PREMIUM',
        membershipExpiresAt: new Date('2027-01-01'),
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-charlie',
        email: 'charlie@example.com',
        password: passwordHash,
        displayName: 'Charlie Kim',
        avatarUrl: 'https://i.pravatar.cc/150?u=charlie',
        bio: 'New to Seattle. Exploring everything!',
        membershipTier: 'FREE',
      },
    }),
  ]);

  // Create organizer users for events
  const organizers = await Promise.all([
    prisma.user.create({ data: { id: 'org-neumos', email: 'events@neumos.com', password: passwordHash, displayName: 'Neumos' } }),
    prisma.user.create({ data: { id: 'org-foodtours', email: 'info@seattlefoodtours.com', password: passwordHash, displayName: 'Seattle Food Tours' } }),
    prisma.user.create({ data: { id: 'org-fremont', email: 'arts@fremontartscouncil.org', password: passwordHash, displayName: 'Fremont Arts Council' } }),
    prisma.user.create({ data: { id: 'org-ecs', email: 'info@weareecs.com', password: passwordHash, displayName: 'Emerald City Supporters' } }),
    prisma.user.create({ data: { id: 'org-technet', email: 'hello@seattletechnet.com', password: passwordHash, displayName: 'Seattle Tech Network' } }),
    prisma.user.create({ data: { id: 'org-yoga', email: 'om@seattleoutdooryoga.com', password: passwordHash, displayName: 'Seattle Outdoor Yoga' } }),
    prisma.user.create({ data: { id: 'org-fremont-brew', email: 'events@fremontbrewing.com', password: passwordHash, displayName: 'Fremont Brewing' } }),
    prisma.user.create({ data: { id: 'org-mixology', email: 'classes@seattlemixology.com', password: passwordHash, displayName: 'Seattle Mixology School' } }),
    prisma.user.create({ data: { id: 'org-underground', email: 'info@undergroundseattle.com', password: passwordHash, displayName: 'Underground Events Seattle' } }),
    prisma.user.create({ data: { id: 'org-ppatch', email: 'garden@ballardppatch.org', password: passwordHash, displayName: 'Ballard P-Patch' } }),
  ]);

  // Seed the 10 mock events
  const eventsData = [
    {
      id: 'evt-1',
      title: 'Indie Night at Neumos',
      slug: 'indie-night-at-neumos',
      description: "Experience Seattle's hottest indie bands in Capitol Hill's iconic music venue. Three local acts plus special guest DJ.",
      organizerId: organizers[0].id,
      venueName: 'Neumos',
      venueAddress: '925 E Pike St',
      venueNeighborhood: 'Capitol Hill',
      venueLat: 47.6145,
      venueLng: -122.3195,
      startTime: new Date('2026-04-17T20:00:00'),
      endTime: new Date('2026-04-18T01:00:00'),
      category: 'MUSIC',
      price: 25,
      capacity: 400,
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      tags: JSON.stringify(['indie', 'live-music', '21+', 'late-night']),
    },
    {
      id: 'evt-2',
      title: 'Pike Place Food Tour',
      slug: 'pike-place-food-tour',
      description: 'Guided culinary journey through Pike Place Market. Sample 10+ local favorites from seafood to pastries.',
      organizerId: organizers[1].id,
      venueName: 'Pike Place Market',
      venueAddress: '85 Pike St',
      venueNeighborhood: 'Downtown',
      venueLat: 47.6097,
      venueLng: -122.3425,
      startTime: new Date('2026-04-16T10:00:00'),
      endTime: new Date('2026-04-16T13:00:00'),
      category: 'FOOD_DRINK',
      price: 75,
      capacity: 15,
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      tags: JSON.stringify(['food-tour', 'local', 'market']),
    },
    {
      id: 'evt-3',
      title: 'Fremont Friday Night Art Walk',
      slug: 'fremont-friday-night-art-walk',
      description: 'Explore 15+ galleries and artist studios in quirky Fremont. Free admission, wine and snacks at each stop.',
      organizerId: organizers[2].id,
      venueName: 'Fremont Arts District',
      venueAddress: 'N 35th St & Fremont Ave N',
      venueNeighborhood: 'Fremont',
      venueLat: 47.6505,
      venueLng: -122.3493,
      startTime: new Date('2026-04-17T18:00:00'),
      endTime: new Date('2026-04-17T22:00:00'),
      category: 'ARTS_CULTURE',
      price: 0,
      capacity: 500,
      imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
      tags: JSON.stringify(['art', 'free', 'walkable', 'family-friendly']),
    },
    {
      id: 'evt-4',
      title: 'Sounders FC Watch Party',
      slug: 'sounders-fc-watch-party',
      description: 'Join fellow fans at Fuel Sports for the season opener. Drink specials, prizes, and the best atmosphere in Seattle.',
      organizerId: organizers[3].id,
      venueName: 'Fuel Sports Eats & Beats',
      venueAddress: '1st Ave S',
      venueNeighborhood: 'SODO',
      venueLat: 47.5915,
      venueLng: -122.3271,
      startTime: new Date('2026-04-19T14:00:00'),
      endTime: new Date('2026-04-19T17:00:00'),
      category: 'SPORTS_FITNESS',
      price: 0,
      capacity: 200,
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
      tags: JSON.stringify(['soccer', 'sports', 'free', 'bar']),
    },
    {
      id: 'evt-5',
      title: 'Tech Startup Networking Mixer',
      slug: 'tech-startup-networking-mixer',
      description: "Connect with Seattle's tech community. VCs, founders, and engineers gathering for drinks and conversation.",
      organizerId: organizers[4].id,
      venueName: 'Mox Boarding House',
      venueAddress: '5105 Leary Ave NW',
      venueNeighborhood: 'Ballard',
      venueLat: 47.6661,
      venueLng: -122.3825,
      startTime: new Date('2026-04-18T18:30:00'),
      endTime: new Date('2026-04-18T21:00:00'),
      category: 'NETWORKING',
      price: 15,
      capacity: 100,
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
      tags: JSON.stringify(['tech', 'networking', 'professional', '21+']),
    },
    {
      id: 'evt-6',
      title: 'Sunset Yoga at Kerry Park',
      slug: 'sunset-yoga-at-kerry-park',
      description: 'All-levels yoga class with stunning skyline views. Bring your mat and watch the sunset over Elliott Bay.',
      organizerId: organizers[5].id,
      venueName: 'Kerry Park',
      venueAddress: '211 W Highland Dr',
      venueNeighborhood: 'Queen Anne',
      venueLat: 47.6295,
      venueLng: -122.3598,
      startTime: new Date('2026-04-16T18:00:00'),
      endTime: new Date('2026-04-16T19:15:00'),
      category: 'SPORTS_FITNESS',
      price: 20,
      capacity: 50,
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
      tags: JSON.stringify(['yoga', 'outdoor', 'sunset', 'wellness']),
    },
    {
      id: 'evt-7',
      title: 'Craft Beer & Trivia Night',
      slug: 'craft-beer-trivia-night',
      description: 'Test your knowledge while sampling local brews. Teams of 4-6, prizes for top 3 teams.',
      organizerId: organizers[6].id,
      venueName: 'Fremont Brewing Urban Beer Garden',
      venueAddress: '1050 N 34th St',
      venueNeighborhood: 'Fremont',
      venueLat: 47.6488,
      venueLng: -122.3467,
      startTime: new Date('2026-04-15T19:00:00'),
      endTime: new Date('2026-04-15T22:00:00'),
      category: 'NIGHTLIFE',
      price: 0,
      capacity: 120,
      imageUrl: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800',
      tags: JSON.stringify(['trivia', 'beer', 'free', 'team-event']),
    },
    {
      id: 'evt-8',
      title: 'Introduction to Mixology Workshop',
      slug: 'introduction-to-mixology-workshop',
      description: 'Learn to craft 5 classic cocktails from a professional bartender. All ingredients and tools provided.',
      organizerId: organizers[7].id,
      venueName: 'Canon',
      venueAddress: '928 12th Ave',
      venueNeighborhood: 'Capitol Hill',
      venueLat: 47.6074,
      venueLng: -122.3178,
      startTime: new Date('2026-04-20T19:00:00'),
      endTime: new Date('2026-04-20T21:30:00'),
      category: 'LEARNING',
      price: 85,
      capacity: 16,
      imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
      tags: JSON.stringify(['cocktails', 'class', 'hands-on', '21+']),
    },
    {
      id: 'evt-9',
      title: 'Electronic Music Showcase',
      slug: 'electronic-music-showcase',
      description: 'Four DJs spinning house, techno, and ambient. Immersive lighting and visuals in an intimate warehouse space.',
      organizerId: organizers[8].id,
      venueName: 'The Warehouse',
      venueAddress: 'Georgetown (exact address upon RSVP)',
      venueNeighborhood: 'Georgetown',
      venueLat: 47.5584,
      venueLng: -122.3213,
      startTime: new Date('2026-04-18T22:00:00'),
      endTime: new Date('2026-04-19T04:00:00'),
      category: 'NIGHTLIFE',
      price: 30,
      capacity: 250,
      imageUrl: 'https://images.unsplash.com/photo-1571266028243-d220c8b6fea4?w=800',
      tags: JSON.stringify(['electronic', 'dj', 'late-night', '21+', 'dance']),
    },
    {
      id: 'evt-10',
      title: 'Community Garden Volunteer Day',
      slug: 'community-garden-volunteer-day',
      description: 'Help maintain the Ballard P-Patch. All ages welcome. Coffee and pastries provided.',
      organizerId: organizers[9].id,
      venueName: 'Ballard P-Patch Community Garden',
      venueAddress: '8560 25th Ave NW',
      venueNeighborhood: 'Ballard',
      venueLat: 47.6896,
      venueLng: -122.3837,
      startTime: new Date('2026-04-18T09:00:00'),
      endTime: new Date('2026-04-18T12:00:00'),
      category: 'COMMUNITY',
      price: 0,
      capacity: 30,
      imageUrl: 'https://images.unsplash.com/photo-1592423619508-61bad43b7cd8?w=800',
      tags: JSON.stringify(['volunteer', 'gardening', 'free', 'family-friendly']),
    },
  ];

  for (const eventData of eventsData) {
    await prisma.event.create({ data: eventData });
  }

  console.log('Created 10 events');

  // Create sample bookings (matching approximate ticket counts from mock data)
  const bookingSeeds = [
    // Indie Night - 342 sold (we'll seed a handful + the test users)
    { userId: alice.id, eventId: 'evt-1', ticketCount: 2, totalPaid: 50 },
    { userId: bob.id, eventId: 'evt-1', ticketCount: 1, totalPaid: 25 },
    { userId: charlie.id, eventId: 'evt-1', ticketCount: 1, totalPaid: 25 },
    // Pike Place Food Tour - 14 sold
    { userId: alice.id, eventId: 'evt-2', ticketCount: 1, totalPaid: 75 },
    { userId: bob.id, eventId: 'evt-2', ticketCount: 1, totalPaid: 75 },
    // Fremont Art Walk - 287
    { userId: alice.id, eventId: 'evt-3', ticketCount: 1, totalPaid: 0 },
    { userId: bob.id, eventId: 'evt-3', ticketCount: 1, totalPaid: 0 },
    { userId: charlie.id, eventId: 'evt-3', ticketCount: 1, totalPaid: 0 },
    // Sounders Watch Party - 156
    { userId: alice.id, eventId: 'evt-4', ticketCount: 1, totalPaid: 0 },
    { userId: charlie.id, eventId: 'evt-4', ticketCount: 1, totalPaid: 0 },
    // Tech Mixer - 94
    { userId: alice.id, eventId: 'evt-5', ticketCount: 1, totalPaid: 15 },
    { userId: bob.id, eventId: 'evt-5', ticketCount: 1, totalPaid: 15 },
    { userId: charlie.id, eventId: 'evt-5', ticketCount: 1, totalPaid: 15 },
    // Sunset Yoga - 48
    { userId: alice.id, eventId: 'evt-6', ticketCount: 1, totalPaid: 20 },
    // Trivia Night - 86
    { userId: bob.id, eventId: 'evt-7', ticketCount: 1, totalPaid: 0 },
    { userId: charlie.id, eventId: 'evt-7', ticketCount: 1, totalPaid: 0 },
    // Electronic showcase - 198
    { userId: alice.id, eventId: 'evt-9', ticketCount: 2, totalPaid: 60 },
    { userId: bob.id, eventId: 'evt-9', ticketCount: 1, totalPaid: 30 },
    // Community garden - 22
    { userId: charlie.id, eventId: 'evt-10', ticketCount: 1, totalPaid: 0 },
  ];

  for (const b of bookingSeeds) {
    await prisma.booking.create({
      data: {
        ...b,
        status: 'CONFIRMED',
      },
    });
  }

  console.log('Created sample bookings');

  // Create friendships
  await prisma.friendship.createMany({
    data: [
      { requesterId: alice.id, addresseeId: bob.id, status: 'ACCEPTED' },
      { requesterId: alice.id, addresseeId: charlie.id, status: 'ACCEPTED' },
      { requesterId: bob.id, addresseeId: charlie.id, status: 'PENDING' },
    ],
  });

  console.log('Created friendships');

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: alice.id,
        type: 'FOMO_SPIKE',
        title: 'FOMO Alert!',
        message: '"Pike Place Food Tour" is trending with a FOMO score of 92! Don\'t miss out.',
        eventId: 'evt-2',
      },
      {
        userId: alice.id,
        type: 'FRIEND_RSVP',
        title: 'Friend is Going!',
        message: 'Bob Martinez just RSVP\'d to "Craft Beer & Trivia Night".',
        eventId: 'evt-7',
      },
      {
        userId: bob.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed!',
        message: 'Your booking for "Indie Night at Neumos" has been confirmed.',
        eventId: 'evt-1',
      },
      {
        userId: bob.id,
        type: 'EVENT_REMINDER',
        title: 'Event Tomorrow!',
        message: '"Tech Startup Networking Mixer" is tomorrow at 6:30 PM.',
        eventId: 'evt-5',
      },
      {
        userId: charlie.id,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        message: 'Bob Martinez sent you a friend request.',
      },
      {
        userId: charlie.id,
        type: 'FOMO_SPIKE',
        title: 'FOMO Alert!',
        message: '"Electronic Music Showcase" is selling fast! FOMO score: 79.',
        eventId: 'evt-9',
      },
      {
        userId: alice.id,
        type: 'PRICE_DROP',
        title: 'Price Drop!',
        message: '"Introduction to Mixology Workshop" just dropped to $85.',
        eventId: 'evt-8',
        isRead: true,
      },
    ],
  });

  console.log('Created notifications');

  // Create saved events
  await prisma.savedEvent.createMany({
    data: [
      { userId: alice.id, eventId: 'evt-8' },
      { userId: alice.id, eventId: 'evt-9' },
      { userId: bob.id, eventId: 'evt-3' },
      { userId: bob.id, eventId: 'evt-6' },
      { userId: charlie.id, eventId: 'evt-1' },
      { userId: charlie.id, eventId: 'evt-5' },
    ],
  });

  console.log('Created saved events');
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
