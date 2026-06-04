'use server'

import { auth } from '@clerk/nextjs/server'
import connectDB from '@/lib/db'
import Event from '@/models/Event'
import User from '@/models/User'
import Registration from '@/models/Registration'
import { revalidatePath } from 'next/cache'

export async function createEvent(data) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    await connectDB()
    const user = await User.findOne({ clerkId: userId })
    if (!user) throw new Error('User not found')

    const hasPro = data.hasPro || false;

    // Verify limit for free users
    if (!hasPro && user.freeEventsCreated >= 5) {
      throw new Error('Free event limit reached. Please upgrade to Pro to create more events.')
    }

    const defaultColor = "#1e3a8a";
    if (!hasPro && data.themeColor && data.themeColor !== defaultColor) {
      throw new Error('Custom theme colors are a Pro feature. Please upgrade to Pro.')
    }

    const themeColor = hasPro ? data.themeColor : defaultColor;
    
    // Generate slug
    const baseSlug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    const slug = `${baseSlug}-${Date.now()}`

    const newEvent = await Event.create({
      ...data,
      themeColor,
      slug,
      organizerId: user._id,
      organizerName: user.name,
      registrationCount: 0
    })

    // Update free event count
    user.freeEventsCreated += 1
    await user.save()

    revalidatePath('/')
    revalidatePath('/dashboard')

    return { eventId: newEvent._id.toString(), slug: newEvent.slug }
  } catch (error) {
    console.error('Failed to create event:', error)
    throw new Error(error.message || 'Failed to create event')
  }
}

export async function getEventBySlug({ slug }) {
  try {
    await connectDB()
    const event = await Event.findOne({ slug })
    if (!event) return null
    const approvedCount = await Registration.countDocuments({
      eventId: event._id,
      status: { $in: ['approved', 'confirmed'] },
    })
    const eventObj = event.toObject()
    eventObj.registrationCount = approvedCount
    return JSON.parse(JSON.stringify(eventObj))
  } catch (error) {
    console.error('Error fetching event by slug:', error)
    return null
  }
}

export async function getMyEvents() {
  try {
    const { userId } = await auth()
    if (!userId) return []

    await connectDB()
    const user = await User.findOne({ clerkId: userId })
    if (!user) return []

    const events = await Event.find({ organizerId: user._id }).sort({ createdAt: -1 })
    const eventObjects = events.map((event) => event.toObject())
    const counts = await Registration.aggregate([
      {
        $match: {
          eventId: { $in: eventObjects.map((event) => event._id) },
          status: { $in: ['approved', 'confirmed'] },
        },
      },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ])
    const countByEvent = new Map(counts.map((item) => [item._id.toString(), item.count]))
    const eventsWithCounts = eventObjects.map((event) => ({
      ...event,
      registrationCount: countByEvent.get(event._id.toString()) || 0,
    }))
    return JSON.parse(JSON.stringify(eventsWithCounts))
  } catch (error) {
    console.error('Error fetching my events:', error)
    return []
  }
}

export async function deleteEvent(eventId) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    await connectDB()
    const user = await User.findOne({ clerkId: userId })
    if (!user) throw new Error('User not found')

    const event = await Event.findById(eventId)
    if (!event) throw new Error('Event not found')

    if (event.organizerId.toString() !== user._id.toString()) {
      throw new Error('Not authorized to delete this event')
    }

    // Delete registrations
    await Registration.deleteMany({ eventId })

    // Delete event
    await Event.findByIdAndDelete(eventId)

    if (event.ticketType === 'free' && user.freeEventsCreated > 0) {
      user.freeEventsCreated -= 1
      await user.save()
    }

    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting event:', error)
    throw new Error(error.message || 'Failed to delete event')
  }
}
