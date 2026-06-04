'use server'

import connectDB from '@/lib/db'
import Event from '@/models/Event'
import Registration from '@/models/Registration'

async function withApprovedCounts(events) {
  const plainEvents = events.map((event) => event.toObject());
  const counts = await Registration.aggregate([
    {
      $match: {
        eventId: { $in: plainEvents.map((event) => event._id) },
        status: { $in: ['approved', 'confirmed'] },
      },
    },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]);
  const countByEvent = new Map(counts.map((item) => [item._id.toString(), item.count]));

  return plainEvents.map((event) => ({
    ...event,
    registrationCount: countByEvent.get(event._id.toString()) || 0,
  }));
}

export async function searchEvents(params) {
  if (params === "skip" || !params || !params.query) {
    return []
  }

  try {
    await connectDB()
    const { query, limit = 5 } = params

    const events = await Event.find({
      endDate: { $gte: new Date() }, // Only upcoming/active events
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ startDate: 1 })
    .limit(limit)

    return JSON.parse(JSON.stringify(await withApprovedCounts(events)))
  } catch (error) {
    console.error('Error searching events:', error)
    return []
  }
}
