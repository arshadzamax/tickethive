import * as venueRepo from '../repositories/venue.repo.js'
import ApiError from '../utils/ApiError.js'

export async function getVenues(req, res, next) {
  try {
    const venues = await venueRepo.getAllVenues()
    res.json(venues)
  } catch (err) {
    next(err)
  }
}

export async function getVenue(req, res, next) {
  try {
    const venue = await venueRepo.getVenueById(req.params.id)
    if (!venue) {
      throw new ApiError(404, 'Venue not found')
    }
    res.json(venue)
  } catch (err) {
    next(err)
  }
}

export async function createVenue(req, res, next) {
  try {
    const { name, type, rows, cols, totalCapacity, defaultPremiumRows } = req.body

    if (!name || !name.trim()) throw new ApiError(400, 'Venue name is required')
    if (!type || !['SEATED', 'GENERAL'].includes(type)) throw new ApiError(400, 'Venue type must be SEATED or GENERAL')

    const venueType = type.toUpperCase()

    if (venueType === 'SEATED') {
      const gridRows = Math.max(1, Math.min(20, parseInt(rows) || 5))
      const gridCols = Math.max(1, Math.min(30, parseInt(cols) || 10))
      const premiumRowsArray = Array.isArray(defaultPremiumRows) ? defaultPremiumRows : []

      const venue = await venueRepo.createVenue({
        name: name.trim(),
        type: venueType,
        rows: gridRows,
        cols: gridCols,
        totalCapacity: gridRows * gridCols,
        defaultPremiumRows: premiumRowsArray
      })

      res.status(201).json(venue)
    } else {
      const capacity = Math.max(50, parseInt(totalCapacity) || 500)

      const venue = await venueRepo.createVenue({
        name: name.trim(),
        type: venueType,
        rows: null,
        cols: null,
        totalCapacity: capacity,
        defaultPremiumRows: []
      })

      res.status(201).json(venue)
    }
  } catch (err) {
    next(err)
  }
}
