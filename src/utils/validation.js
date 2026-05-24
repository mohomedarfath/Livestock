export function required(value, message) {
  if (typeof value === 'string' && !value.trim()) return message
  if (value === undefined || value === null || value === '') return message
  return null
}

export function positiveNumber(value, message) {
  if (value === '' || value === null || value === undefined) return message
  if (Number.isNaN(Number(value)) || Number(value) <= 0) return message
  return null
}

export function validateExpense(form) {
  const errors = {}
  const dateError = required(form.date, 'Date is required')
  const amountError = positiveNumber(form.amount, 'Enter a valid amount')
  const categoryError = required(form.category, 'Category is required')
  const descriptionError = required(form.description, 'Description is required')

  if (dateError) errors.date = dateError
  if (amountError) errors.amount = amountError
  if (categoryError) errors.category = categoryError
  if (descriptionError) errors.description = descriptionError

  return errors
}

export function validateVaccination(form) {
  const errors = {}
  const nameError = required(form.name, 'Vaccine name is required')
  const dueDateError = required(form.dueDate, 'Due date is required')
  const flockError = required(form.flockId || form.flock, 'Select a flock')

  if (nameError) errors.name = nameError
  if (dueDateError) errors.dueDate = dueDateError
  if (flockError) errors.flock = flockError

  return errors
}

export function validateSale(form) {
  const errors = {}
  const quantityError = positiveNumber(form.quantity, 'Quantity must be greater than 0')
  const priceError = positiveNumber(form.pricePerUnit, 'Price must be greater than 0')
  const buyerError = required(form.buyerName, 'Buyer name is required')

  if (quantityError) errors.quantity = quantityError
  if (priceError) errors.pricePerUnit = priceError
  if (buyerError) errors.buyerName = buyerError

  return errors
}

export function validateUser(form, users, editingId) {
  const errors = {}
  const nameError = required(form.name, 'Name is required')
  const emailError = required(form.email, 'Email is required')
  const roleError = required(form.role, 'Role is required')
  const passwordError = !editingId ? required(form.password, 'Password is required') : null

  if (nameError) errors.name = nameError
  if (emailError) {
    errors.email = emailError
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Invalid email format'
  }
  if (roleError) errors.role = roleError
  if (passwordError) errors.password = passwordError

  const duplicate = users.find(
    (user) => user.email.toLowerCase() === form.email.toLowerCase() && user.id !== editingId
  )
  if (duplicate) errors.email = 'Email already in use'

  return errors
}
