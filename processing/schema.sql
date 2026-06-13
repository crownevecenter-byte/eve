-- schema.sql
-- PostgreSQL Schema for Crown EVE Bike Store

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255),
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    product_type VARCHAR(10) CHECK (product_type IN ('bike', 'part')),
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    sale_price DECIMAL(12, 2),
    stock_qty INT DEFAULT 0,
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bikes Table
CREATE TABLE IF NOT EXISTS bikes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    motor_type VARCHAR(255),
    motor_watt_min INT,
    motor_watt_max INT,
    battery_voltage DECIMAL(10, 2),
    battery_capacity_ah DECIMAL(10, 2),
    battery_type VARCHAR(255),
    speed_min_kmh DECIMAL(10, 2),
    speed_max_kmh DECIMAL(10, 2),
    range_eco_min_km INT,
    range_eco_max_km INT,
    speed_modes INT,
    charger VARCHAR(255),
    charging_time_min_hrs DECIMAL(10, 2),
    charging_time_max_hrs DECIMAL(10, 2),
    net_weight_kg INT,
    loading_capacity_kg INT,
    security TEXT,
    braking_system VARCHAR(255),
    color_options JSONB,
    frame_material VARCHAR(255),
    wheel_size VARCHAR(255),
    warranty VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Parts Table
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    serial_no INT,
    item_code VARCHAR(255) UNIQUE NOT NULL,
    model VARCHAR(255),
    description TEXT,
    cp_price DECIMAL(12, 2),
    image_url VARCHAR(255),
    compatible_models TEXT,
    compatible_bike_ids JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    subtotal DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(12, 2) DEFAULT 0,
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Services Table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100),
    description TEXT,
    base_price DECIMAL(12, 2) NOT NULL,
    duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Service Bookings Table
CREATE TABLE IF NOT EXISTS service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    service_id UUID REFERENCES services(id),
    bike_product_id UUID REFERENCES products(id),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'in_progress', 'done', 'cancelled')),
    customer_notes TEXT,
    final_price DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_parts_item_code ON parts(item_code);
CREATE INDEX idx_parts_model ON parts(model);
CREATE INDEX idx_orders_customer ON orders(customer_id);
