const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// Middleware to check if the order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }

  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}

// Validation middleware for creating and updating orders
function validateOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (!deliverTo || deliverTo === "") {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }

  if (!mobileNumber || mobileNumber === "") {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }

  if (!dishes) {
    return next({
      status: 400,
      message: "Order must include a dish",
    });
  }

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }

  dishes.forEach((dish, index) => {
    if (!dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity <= 0) {
      return next({
        status: 400,
        message: `dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });

  next();
}

// Additional validation for updating orders
function validateOrderUpdate(req, res, next) {
  const { data: { id, status } = {} } = req.body;
  const { orderId } = req.params;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }

  if (!status || status === "") {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (!validStatuses.includes(status)) {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  if (res.locals.order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  next();
}

// List orders
function list(req, res) {
  res.json({ data: orders });
}

// Create order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status = "pending", dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// Read order
function read(req, res) {
  res.json({ data: res.locals.order });
}

// Update order
function update(req, res) {
  const { orderId } = req.params;
  const existingOrder = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  existingOrder.deliverTo = deliverTo;
  existingOrder.mobileNumber = mobileNumber;
  existingOrder.status = status;
  existingOrder.dishes = dishes;

  res.json({ data: existingOrder });
}

// Delete order
function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);

  if (index === -1) {
    return next({
      status: 404,
      message: `Order does not exist: ${orderId}.`,
    });
  }

  if (orders[index].status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }

  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateOrder, create],
  read: [orderExists, read],
  update: [orderExists, validateOrder, validateOrderUpdate, update],
  delete: [orderExists, destroy],
};
