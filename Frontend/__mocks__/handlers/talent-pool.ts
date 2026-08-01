import { http, HttpResponse } from 'msw'; // Changed from 'rest' to 'http', added HttpResponse
import {
  TalentPoolEntry,
  TalentPoolStatus,
  TalentPoolCandidate, // Reverted line 5
} from '../../lib/types/talent-pool'; // Import types from common types file

// Mock data
const mockTalentPool: TalentPoolEntry[] = [
  {
    pool_id: 'tp1',
    candidate: {
      user_id: 'user1',
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      university: 'Sample University',
      year: '2023',
      primary_skills: ['React', 'TypeScript'],
      avatar_url: '/avatars/john.png',
      phone: '123-456-7890',
      location: 'Hanoi',
      bio: 'Frontend Developer',
    },
    highest_score: 95,
    challenges_taken: ['Challenge A', 'Challenge B'],
    status: 'IN_POOL', // Aligned with new TalentPoolStatus
    added_at: new Date().toISOString(),
  },
  {
    pool_id: 'tp2',
    candidate: {
      user_id: 'user2',
      full_name: 'Jane Smith',
      email: 'jane.smith@example.com',
      university: 'Another University',
      year: '2022',
      primary_skills: ['Vue', 'JavaScript'],
      avatar_url: '/avatars/jane.png',
      phone: '098-765-4321',
      location: 'Ho Chi Minh City',
      bio: 'Fullstack Developer',
    },
    highest_score: 88,
    challenges_taken: ['Challenge C'],
    status: 'INVITED', // Aligned with new TalentPoolStatus
    added_at: new Date().toISOString(),
  },
];

export const talentPoolHandlers = [
  // GET /api/v1/talent-pool
  http.get('/api/v1/talent-pool', ({ request: _request, params: _params, cookies: _cookies }) => {
    return HttpResponse.json(mockTalentPool); // Use HttpResponse.json directly
  }),

  // PATCH /api/v1/talent-pool/:poolId/status
  http.patch(
    '/api/v1/talent-pool/:poolId/status',
    async ({ request, params, cookies: _cookies }) => {
      const { poolId } = params;
      const { status } = (await request.json()) as { status: TalentPoolStatus }; // Use request.json()

      const entryIndex = mockTalentPool.findIndex((entry) => entry.pool_id === poolId); // Use pool_id
      if (entryIndex > -1) {
        mockTalentPool[entryIndex].status = status;
        return HttpResponse.json(null, { status: 200 }); // Return empty body with status
      }
      return HttpResponse.json({ message: 'Talent Pool Entry not found' }, { status: 404 });
    }
  ),

  // POST /api/v1/talent-pool
  http.post('/api/v1/talent-pool', async ({ request, params: _params, cookies: _cookies }) => {
    const { user_id } = (await request.json()) as { user_id: string }; // Use request.json()

    if (!user_id) {
      return HttpResponse.json({ message: 'user_id is required' }, { status: 400 });
    }

    // Check if user already in talent pool
    if (mockTalentPool.some((entry) => entry.candidate.user_id === user_id)) {
      // Use candidate.user_id
      return HttpResponse.json({ message: 'User already in talent pool' }, { status: 409 });
    }

    const newEntry: TalentPoolEntry = {
      pool_id: `tp${mockTalentPool.length + 1}`, // Simple ID generation, use pool_id
      candidate: {
        user_id: user_id,
        full_name: `Mock User ${user_id}`,
        email: `${user_id}@example.com`,
        university: 'Mock University',
        year: '2024',
        primary_skills: ['Mock Skill'],
        avatar_url: '/avatars/mock.png',
        phone: 'N/A',
        location: 'N/A',
        bio: 'Mock Candidate',
      },
      highest_score: 70, // Default score
      challenges_taken: [],
      status: 'IN_POOL', // Default status
      added_at: new Date().toISOString(),
    };
    mockTalentPool.push(newEntry);
    return HttpResponse.json(newEntry, { status: 201 });
  }),
];
