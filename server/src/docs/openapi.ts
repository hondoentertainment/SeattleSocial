/**
 * OpenAPI 3.0 specification for the SeattleSocial API.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SeattleSocial API',
    version: '1.0.0',
    description: 'Backend API for the SeattleSocial events platform. Discover events, book tickets, manage friends, and more.',
  },
  servers: [
    { url: '/api', description: 'API base path' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http' as const,
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object' as const,
        properties: {
          error: {
            type: 'object' as const,
            properties: {
              message: { type: 'string' as const },
              statusCode: { type: 'number' as const },
            },
          },
        },
      },
      Pagination: {
        type: 'object' as const,
        properties: {
          page: { type: 'number' as const },
          limit: { type: 'number' as const },
          total: { type: 'number' as const },
          totalPages: { type: 'number' as const },
          hasNext: { type: 'boolean' as const },
          hasPrev: { type: 'boolean' as const },
        },
      },
      User: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          email: { type: 'string' as const },
          displayName: { type: 'string' as const },
          avatarUrl: { type: 'string' as const, nullable: true },
          bio: { type: 'string' as const, nullable: true },
          membershipTier: { type: 'string' as const, enum: ['FREE', 'PREMIUM', 'PREMIUM_PLUS'] },
          membershipExpiresAt: { type: 'string' as const, format: 'date-time', nullable: true },
          createdAt: { type: 'string' as const, format: 'date-time' },
        },
      },
      Event: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          title: { type: 'string' as const },
          slug: { type: 'string' as const },
          description: { type: 'string' as const },
          organizerId: { type: 'string' as const },
          venueName: { type: 'string' as const },
          venueAddress: { type: 'string' as const },
          venueNeighborhood: { type: 'string' as const },
          venueLat: { type: 'number' as const },
          venueLng: { type: 'number' as const },
          startTime: { type: 'string' as const, format: 'date-time' },
          endTime: { type: 'string' as const, format: 'date-time' },
          category: { type: 'string' as const },
          price: { type: 'number' as const },
          capacity: { type: 'number' as const },
          imageUrl: { type: 'string' as const, nullable: true },
          videoUrl: { type: 'string' as const, nullable: true },
          tags: { type: 'array' as const, items: { type: 'string' as const } },
          attendees: { type: 'number' as const },
          friendsGoing: { type: 'number' as const },
          fomoScore: { type: 'number' as const },
          fomoBreakdown: {
            type: 'object' as const,
            properties: {
              ticketVelocity: { type: 'number' as const },
              socialProof: { type: 'number' as const },
              timeUrgency: { type: 'number' as const },
              priceDemand: { type: 'number' as const },
              trendingScore: { type: 'number' as const },
              capacityPressure: { type: 'number' as const },
              total: { type: 'number' as const },
            },
          },
        },
      },
      Booking: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          userId: { type: 'string' as const },
          eventId: { type: 'string' as const },
          status: { type: 'string' as const, enum: ['CONFIRMED', 'CANCELLED', 'WAITLISTED'] },
          ticketCount: { type: 'number' as const },
          totalPaid: { type: 'number' as const },
          createdAt: { type: 'string' as const, format: 'date-time' },
        },
      },
      Notification: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          userId: { type: 'string' as const },
          type: { type: 'string' as const, enum: ['FOMO_SPIKE', 'FRIEND_RSVP', 'EVENT_REMINDER', 'BOOKING_CONFIRMED', 'PRICE_DROP', 'FRIEND_REQUEST'] },
          title: { type: 'string' as const },
          message: { type: 'string' as const },
          isRead: { type: 'boolean' as const },
          eventId: { type: 'string' as const, nullable: true },
          createdAt: { type: 'string' as const, format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object' as const,
        properties: {
          token: { type: 'string' as const },
          user: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
  paths: {
    // --- Health ---
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'API is running',
            content: { 'application/json': { schema: { type: 'object' as const, properties: { status: { type: 'string' as const }, timestamp: { type: 'string' as const }, environment: { type: 'string' as const } } } } },
          },
        },
      },
    },

    // --- Auth ---
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                required: ['email', 'password', 'displayName'],
                properties: {
                  email: { type: 'string' as const, format: 'email' },
                  password: { type: 'string' as const, minLength: 8 },
                  displayName: { type: 'string' as const, minLength: 2, maxLength: 50 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' as const },
                  password: { type: 'string' as const },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Current user', content: { 'application/json': { schema: { type: 'object' as const, properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          '401': { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // --- Events ---
    '/events': {
      get: {
        tags: ['Events'],
        summary: 'List events with optional filters',
        parameters: [
          { name: 'page', in: 'query' as const, schema: { type: 'number' as const }, description: 'Page number' },
          { name: 'limit', in: 'query' as const, schema: { type: 'number' as const }, description: 'Items per page (max 100)' },
          { name: 'category', in: 'query' as const, schema: { type: 'string' as const }, description: 'Filter by category' },
          { name: 'neighborhood', in: 'query' as const, schema: { type: 'string' as const }, description: 'Filter by neighborhood' },
          { name: 'minPrice', in: 'query' as const, schema: { type: 'number' as const }, description: 'Minimum price' },
          { name: 'maxPrice', in: 'query' as const, schema: { type: 'number' as const }, description: 'Maximum price' },
          { name: 'search', in: 'query' as const, schema: { type: 'string' as const }, description: 'Search in title, description, venue, tags' },
          { name: 'dateFrom', in: 'query' as const, schema: { type: 'string' as const, format: 'date-time' }, description: 'Start date filter' },
          { name: 'dateTo', in: 'query' as const, schema: { type: 'string' as const, format: 'date-time' }, description: 'End date filter' },
          { name: 'sortBy', in: 'query' as const, schema: { type: 'string' as const, enum: ['date', 'price', 'fomoScore'] }, description: 'Sort order' },
        ],
        responses: {
          '200': {
            description: 'Paginated list of events',
            content: { 'application/json': { schema: { type: 'object' as const, properties: { data: { type: 'array' as const, items: { $ref: '#/components/schemas/Event' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } },
          },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Create a new event',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                required: ['title', 'description', 'venueName', 'venueAddress', 'venueNeighborhood', 'startTime', 'endTime', 'category', 'capacity'],
                properties: {
                  title: { type: 'string' as const, minLength: 3, maxLength: 200 },
                  description: { type: 'string' as const, minLength: 10 },
                  venueName: { type: 'string' as const },
                  venueAddress: { type: 'string' as const },
                  venueNeighborhood: { type: 'string' as const },
                  venueLat: { type: 'number' as const },
                  venueLng: { type: 'number' as const },
                  startTime: { type: 'string' as const, format: 'date-time' },
                  endTime: { type: 'string' as const, format: 'date-time' },
                  category: { type: 'string' as const },
                  price: { type: 'number' as const },
                  capacity: { type: 'number' as const, minimum: 1 },
                  imageUrl: { type: 'string' as const },
                  videoUrl: { type: 'string' as const },
                  tags: { type: 'array' as const, items: { type: 'string' as const } },
                  isPublished: { type: 'boolean' as const },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Event created', content: { 'application/json': { schema: { type: 'object' as const, properties: { event: { $ref: '#/components/schemas/Event' } } } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Not authenticated' },
        },
      },
    },
    '/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event by ID or slug',
        parameters: [{ name: 'id', in: 'path' as const, required: true, schema: { type: 'string' as const }, description: 'Event ID or slug' }],
        responses: {
          '200': { description: 'Event details', content: { 'application/json': { schema: { type: 'object' as const, properties: { event: { $ref: '#/components/schemas/Event' } } } } } },
          '404': { description: 'Event not found' },
        },
      },
      put: {
        tags: ['Events'],
        summary: 'Update an event (owner only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                properties: {
                  title: { type: 'string' as const },
                  description: { type: 'string' as const },
                  venueName: { type: 'string' as const },
                  venueAddress: { type: 'string' as const },
                  venueNeighborhood: { type: 'string' as const },
                  startTime: { type: 'string' as const, format: 'date-time' },
                  endTime: { type: 'string' as const, format: 'date-time' },
                  category: { type: 'string' as const },
                  price: { type: 'number' as const },
                  capacity: { type: 'number' as const },
                  imageUrl: { type: 'string' as const },
                  videoUrl: { type: 'string' as const },
                  tags: { type: 'array' as const, items: { type: 'string' as const } },
                  isPublished: { type: 'boolean' as const },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Event updated', content: { 'application/json': { schema: { type: 'object' as const, properties: { event: { $ref: '#/components/schemas/Event' } } } } } },
          '403': { description: 'Not the event owner' },
          '404': { description: 'Event not found' },
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Delete an event (owner only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        responses: {
          '200': { description: 'Event deleted' },
          '403': { description: 'Not the event owner' },
          '404': { description: 'Event not found' },
        },
      },
    },

    // --- Bookings ---
    '/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Create a booking',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                required: ['eventId'],
                properties: {
                  eventId: { type: 'string' as const },
                  ticketCount: { type: 'number' as const, minimum: 1, maximum: 10 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Booking created', content: { 'application/json': { schema: { type: 'object' as const, properties: { booking: { $ref: '#/components/schemas/Booking' } } } } } },
          '400': { description: 'Validation error or capacity exceeded' },
          '404': { description: 'Event not found' },
          '409': { description: 'Already booked' },
        },
      },
      get: {
        tags: ['Bookings'],
        summary: 'List current user bookings',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query' as const, schema: { type: 'number' as const } },
          { name: 'limit', in: 'query' as const, schema: { type: 'number' as const } },
        ],
        responses: {
          '200': {
            description: 'Paginated bookings',
            content: { 'application/json': { schema: { type: 'object' as const, properties: { data: { type: 'array' as const, items: { $ref: '#/components/schemas/Booking' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } },
          },
        },
      },
    },
    '/bookings/{id}': {
      delete: {
        tags: ['Bookings'],
        summary: 'Cancel a booking',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        responses: {
          '200': { description: 'Booking cancelled' },
          '400': { description: 'Already cancelled' },
          '403': { description: 'Not your booking' },
          '404': { description: 'Booking not found' },
        },
      },
    },

    // --- Users ---
    '/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile with stats',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile and stats',
            content: { 'application/json': { schema: { type: 'object' as const, properties: { user: { $ref: '#/components/schemas/User' }, stats: { type: 'object' as const, properties: { eventsAttended: { type: 'number' as const }, eventsOrganized: { type: 'number' as const }, friendsCount: { type: 'number' as const }, savedCount: { type: 'number' as const } } } } } } },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update current user profile',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                properties: {
                  displayName: { type: 'string' as const },
                  avatarUrl: { type: 'string' as const },
                  bio: { type: 'string' as const },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated user', content: { 'application/json': { schema: { type: 'object' as const, properties: { user: { $ref: '#/components/schemas/User' } } } } } },
        },
      },
    },
    '/users/{id}/public': {
      get: {
        tags: ['Users'],
        summary: 'Get public user profile',
        parameters: [{ name: 'id', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        responses: {
          '200': { description: 'Public user profile' },
          '404': { description: 'User not found' },
        },
      },
    },
    '/users/saved-events': {
      get: {
        tags: ['Users'],
        summary: 'List saved events',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query' as const, schema: { type: 'number' as const } },
          { name: 'limit', in: 'query' as const, schema: { type: 'number' as const } },
        ],
        responses: {
          '200': { description: 'Paginated saved events' },
        },
      },
    },
    '/users/saved-events/{eventId}': {
      post: {
        tags: ['Users'],
        summary: 'Save an event',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'eventId', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        responses: {
          '201': { description: 'Event saved' },
          '404': { description: 'Event not found' },
          '409': { description: 'Already saved' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Unsave an event',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'eventId', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        responses: {
          '200': { description: 'Event unsaved' },
          '404': { description: 'Saved event not found' },
        },
      },
    },
    '/users/friends': {
      get: {
        tags: ['Users'],
        summary: 'List accepted friends',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query' as const, schema: { type: 'number' as const } },
          { name: 'limit', in: 'query' as const, schema: { type: 'number' as const } },
        ],
        responses: {
          '200': { description: 'Paginated friends list' },
        },
      },
    },
    '/users/friends/{userId}': {
      post: {
        tags: ['Users'],
        summary: 'Send a friend request',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        responses: {
          '201': { description: 'Friend request sent' },
          '400': { description: 'Cannot befriend yourself' },
          '404': { description: 'User not found' },
          '409': { description: 'Already friends or request pending' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Accept or decline a friend request',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                required: ['action'],
                properties: {
                  action: { type: 'string' as const, enum: ['accept', 'decline'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Friend request updated' },
          '400': { description: 'Invalid action' },
          '404': { description: 'No pending request' },
        },
      },
    },
    '/users/friends/going/{eventId}': {
      get: {
        tags: ['Users'],
        summary: 'Get friends going to an event',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'eventId', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        responses: {
          '200': { description: 'List of friends going', content: { 'application/json': { schema: { type: 'object' as const, properties: { friends: { type: 'array' as const, items: { type: 'object' as const, properties: { id: { type: 'string' as const }, displayName: { type: 'string' as const }, avatarUrl: { type: 'string' as const, nullable: true } } } } } } } } },
        },
      },
    },

    // --- Notifications ---
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications for current user',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query' as const, schema: { type: 'number' as const } },
          { name: 'limit', in: 'query' as const, schema: { type: 'number' as const } },
        ],
        responses: {
          '200': {
            description: 'Paginated notifications',
            content: { 'application/json': { schema: { type: 'object' as const, properties: { data: { type: 'array' as const, items: { $ref: '#/components/schemas/Notification' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } },
          },
        },
      },
    },
    '/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Get count of unread notifications',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Unread count', content: { 'application/json': { schema: { type: 'object' as const, properties: { count: { type: 'number' as const } } } } } },
        },
      },
    },
    '/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'All marked as read' },
        },
      },
    },
    '/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark a single notification as read',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path' as const, required: true, schema: { type: 'string' as const } }],
        responses: {
          '200': { description: 'Notification marked as read' },
          '403': { description: 'Not your notification' },
          '404': { description: 'Notification not found' },
        },
      },
    },

    // --- Payments ---
    '/payments/checkout': {
      post: {
        tags: ['Payments'],
        summary: 'Create a payment checkout for an event',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                required: ['eventId'],
                properties: {
                  eventId: { type: 'string' as const },
                  ticketCount: { type: 'number' as const, minimum: 1, maximum: 10 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment intent created',
            content: { 'application/json': { schema: { type: 'object' as const, properties: { clientSecret: { type: 'string' as const }, paymentId: { type: 'string' as const }, amount: { type: 'number' as const }, mock: { type: 'boolean' as const } } } } },
          },
          '400': { description: 'Free event or validation error' },
          '404': { description: 'Event not found' },
        },
      },
    },
    '/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Stripe webhook endpoint',
        description: 'Receives Stripe payment events. Requires raw body and stripe-signature header.',
        responses: {
          '200': { description: 'Webhook processed' },
          '400': { description: 'Invalid signature' },
        },
      },
    },
    '/payments/membership': {
      post: {
        tags: ['Payments'],
        summary: 'Upgrade membership tier',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object' as const,
                required: ['tier'],
                properties: {
                  tier: { type: 'string' as const, enum: ['PREMIUM', 'PREMIUM_PLUS'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Checkout session or mock upgrade',
            content: { 'application/json': { schema: { type: 'object' as const, properties: { sessionUrl: { type: 'string' as const }, mock: { type: 'boolean' as const }, message: { type: 'string' as const } } } } },
          },
          '400': { description: 'Invalid tier or already on plan' },
        },
      },
    },
  },
};
