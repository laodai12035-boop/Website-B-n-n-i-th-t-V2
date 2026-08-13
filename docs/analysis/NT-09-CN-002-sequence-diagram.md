# Thiết kế luồng xử lý: NT-09-CN-002 — Trừ/Hoàn kho tự động theo trạng thái đơn hàng (QTN-03)

## 1. Sequence Diagram: Tự động trừ kho khi đơn hàng được xác nhận / thanh toán

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant OrderRoute as API Routes (/orders /admin)
    participant OrderService as OrderService / QRPaymentService
    participant StockService as StockService
    participant DB as MySQL Database

    Admin->>OrderRoute: PUT /api/v1/admin/orders/<id>/status {status: "confirmed"}
    OrderRoute->>OrderService: update_order_status(admin_id, order_id, "confirmed")
    OrderService->>DB: Query Order & OrderItems
    DB-->>OrderService: Order Data (stock_deducted)
    
    alt stock_deducted == False
        OrderService->>StockService: deduct_order_stock(order)
        loop Với mỗi Item trong Order
            StockService->>DB: Query Product(product_id)
            DB-->>StockService: Product (stock)
            StockService->>StockService: product.stock -= item.quantity
        end
        StockService->>OrderService: order.stock_deducted = True
    else stock_deducted == True
        OrderService->>StockService: Skip deduction (Idempotent)
    end

    OrderService->>DB: Commit Transaction (order.status="confirmed", product.stock)
    DB-->>OrderService: Success
    OrderService-->>OrderRoute: Updated Order DTO
    OrderRoute-->>Admin: 200 OK (Xác nhận đơn & trừ kho thành công)
```

---

## 2. Sequence Diagram: Tự động hoàn kho khi đơn hàng bị hủy

```mermaid
sequenceDiagram
    autonumber
    actor UserOrAdmin as Khách hàng / Admin
    participant OrderRoute as API Routes (/orders /admin)
    participant OrderService as OrderService
    participant StockService as StockService
    participant DB as MySQL Database

    UserOrAdmin->>OrderRoute: POST /api/v1/orders/<id>/cancel {reason: "Khách đổi ý"}
    OrderRoute->>OrderService: cancel_order(user_id, order_id, reason)
    OrderService->>DB: Query Order & OrderItems
    DB-->>OrderService: Order Data (stock_deducted = True)

    alt stock_deducted == True
        OrderService->>StockService: restore_order_stock(order)
        loop Với mỗi Item trong Order
            StockService->>DB: Query Product(product_id)
            DB-->>StockService: Product (stock)
            StockService->>StockService: product.stock += item.quantity
        end
        StockService->>OrderService: order.stock_deducted = False
    else stock_deducted == False
        OrderService->>StockService: Skip restoration (Already restored or never deducted)
    end

    OrderService->>DB: Commit Transaction (order.status="cancelled", product.stock)
    DB-->>OrderService: Success
    OrderService-->>OrderRoute: Cancelled Order DTO
    OrderRoute-->>UserOrAdmin: 200 OK (Hủy đơn & hoàn kho thành công)
```
