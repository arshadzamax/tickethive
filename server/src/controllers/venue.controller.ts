import type { Request, Response, NextFunction } from 'express'
import * as venueRepo from '../repositories/venue.repo.js'
import ApiError from '../utils/ApiError.js'
import { getParamAsString } from '../utils/params.js'
import { createVenueSchema } from '../utils/schemas.js'
import type { ApiResponse } from '../types/response.js'

export async function getVenues(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venues = await venueRepo.getAllVenues()
    res.json({ success: true, data: venues } satisfies ApiResponse<typeof venues>)
  } catch (err) {
    next(err)
  }
}

export async function getVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const venue = await venueRepo.getVenueById(getParamAsString(req, 'id'))
    if (!venue) {
      throw new ApiError(404, 'Venue not found')
    }
    res.json({ success: true, data: venue } satisfies ApiResponse<typeof venue>)
  } catch (err) {
    next(err)
  }
}

export async function createVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, type, rows, cols, totalCapacity, defaultPremiumRows } = createVenueSchema.parse(req.body)

    if (type === 'SEATED') {
      const gridRows = rows || 5
      const gridCols = cols || 10

      const venue = await venueRepo.createVenue({
        name,
        type,
        rows: gridRows,
        cols: gridCols,
        totalCapacity: gridRows * gridCols,
        defaultPremiumRows: defaultPremiumRows || []
      })

      res.status(201).json({ success: true, data: venue } satisfies ApiResponse<typeof venue>)
    } else {
      const capacity = totalCapacity || 500

      const venue = await venueRepo.createVenue({
        name,
        type,
        rows: null,
        cols: null,
        totalCapacity: capacity,
        defaultPremiumRows: []
      })

      res.status(201).json({ success: true, data: venue } satisfies ApiResponse<typeof venue>)
    }
  } catch (err) {
    next(err)
  }
}

