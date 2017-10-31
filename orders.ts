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

const loadOrder = (orderId: number) : Promise<Order> => { 
  return new Promise(res => {
    setTimeout(() => res({
      id: orderId,
      items: [
        { id: 1, qty: 4, unitPrice: 10 },
        { id: 4, qty: 2, unitPrice:  7 },
      ],
    }), 0)
  })  
}

const isValid = (order: Order) : boolean => (order.id !== 3)

const processPayment = (order: Order) : Promise<number> =>  {
  return new Promise((res, rej) => {
    setTimeout(() => (order.id !== 2) ? res(123) : rej('no credit'), 0)
  })
}

const confirmOrder = (trId: number, order: Order) : Order => {
  return (Object as any).assign({}, order, { transactionId: trId })
}

function createOrder(payload) : Promise<any> {
  return loadOrder(payload.orderId).then(order => {
    if (isValid(order)) {
      const transactionId = processPayment(order).then(trId => {
        const confirmedOrder = confirmOrder(trId, order)        
        return {status: 'ok', confirmedOrder: confirmedOrder }
      }).catch(err => {
        return {status: 'error', message: 'payment failed'}
      })
      return transactionId
    } else {
      return {status: 'error', message: 'order is not valid'}
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

  it('should fail payment on order 2' , () =>
    createOrder({ orderId: 2 })
      .then(o => 
        expect(o).to.deep.equals({
          status: 'error',
          message: 'payment failed'
        })
      )
  )

  it('should fail order validation on order 3' , () =>
    createOrder({ orderId: 3 })
      .then(o => 
        expect(o).to.deep.equals({
          status: 'error',
          message: 'order is not valid'
        })
      )
  )

})

