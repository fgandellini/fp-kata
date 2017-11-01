import * as mocha from 'mocha'
import * as chai from 'chai'
const expect = chai.expect

// code /////////////////////////////////////////////////////////

interface Item {
  id: number,
  qty: number,
  unitPrice: number
}

interface Order {
  id: number,
  items: Array<Item>,
}

interface ConfirmedOrder extends Order {
  transactionId: number
}

interface OrderCreationSuccess { status: 'ok', confirmedOrder: ConfirmedOrder }
interface OrderCreationError { status: 'error', message: string }
type OrderCreationResult = OrderCreationSuccess | OrderCreationError

type PaymentResult = number

const loadOrder = (orderId: number) : Promise<Order> => {
  return new Promise((res, rej) => {
    setTimeout(() => (orderId !== 4)
      ? res({
          id: orderId,
          items: [
            { id: 1, qty: 4, unitPrice: 10 },
            { id: 4, qty: 2, unitPrice:  7 },
          ],
        })
      : rej('order not found!')
    , 0)
  })  
}

const isValid = (order: Order) : boolean => (order.id !== 3)

const processPayment = (order: Order) : Promise<PaymentResult> =>  {
  return new Promise((res, rej) => {
    setTimeout(() => (order.id !== 2) ? res(123) : rej('no credit'), 0)
  })
}

const confirmOrder = (trId: number, order: Order) : ConfirmedOrder => {
  return (Object as any).assign({}, order, { transactionId: trId })
}

function createOrder(payload) : Promise<OrderCreationResult> {
  return loadOrder(payload.orderId).then(order => {
    if (isValid(order)) {
      const transactionId = processPayment(order).then(trId => {
        const confirmedOrder = confirmOrder(trId, order)        
        return ({ status: 'ok', confirmedOrder: confirmedOrder }) as OrderCreationSuccess // <- TypeScript seems not understand this without the cast 
      }).catch(err => {
        return Promise.reject({ status: 'error', message: 'payment failed' })
      })
      return transactionId
    } else {
      return Promise.reject({ status: 'error', message: 'order is not valid' })
    }
  })
}

// tests ////////////////////////////////////////////////////////////

describe('createOrder', () => {
  
  it('should successfully create order 1' , () =>
    createOrder({ orderId: 1 })
      .then(o => 
        expect(o).to.deep.equals({
          status: 'ok',
          confirmedOrder: {
            id: 1,
            items: [
              { id: 1, qty: 4, unitPrice: 10 },
              { id: 4, qty: 2, unitPrice:  7 },
            ],
            transactionId: 123,
          }
        })
      )
  )

  it('should fail payment on order 2' , done => {
    createOrder({ orderId: 2 })
      .catch(err => {
        expect(err).to.deep.equals({
          status: 'error',
          message: 'payment failed'
        })
        done()
      })
  })

  it('should fail order validation on order 3' , done => {
    createOrder({ orderId: 3 })
      .catch(err => {
        expect(err).to.deep.equals({
          status: 'error',
          message: 'order is not valid'
        })
        done()
      })
  })

  it('should fail to load order 4' , done => {
    createOrder({ orderId: 4 })
      .catch(err => {
        expect(err).to.equals('order not found!')
        done()
      })
  })

})

