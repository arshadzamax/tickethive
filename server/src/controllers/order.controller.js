import { getOrdersByUser } from '../repositories/order.repo.js'

export async function listOrders(req, res, next) {
  try {
    const userId = req.user.id
    const orders = await getOrdersByUser(userId)
    res.json(orders)
  } catch (err) {
    next(err)
  }
}

