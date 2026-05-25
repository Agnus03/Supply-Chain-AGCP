-- ============================================================
-- SEED DATA — CadenaSuministros
-- 20 products, 20 shipments, 80 sensor readings,
-- delivery reports, shipping costs, inventory items,
-- stock movements, quality checkpoints, shipment events
-- ============================================================
-- This runs AFTER Hibernate DDL because
-- spring.jpa.defer-datasource-initialization=true
-- ============================================================

TRUNCATE TABLE
  products, shipments, sensor_readings, delivery_reports,
  shipping_costs, inventory_items, stock_movements,
  quality_checkpoints, shipment_events
CASCADE;

-- ============================================================
-- PRODUCTS  (20 agricultural items)
-- ============================================================
INSERT INTO products (id, sku, name) VALUES
  (gen_random_uuid(), 'FRESA-001', 'Fresa Orgánica'),
  (gen_random_uuid(), 'MANZ-002', 'Manzana Roja'),
  (gen_random_uuid(), 'PERA-003', 'Pera Verde'),
  (gen_random_uuid(), 'BANA-004', 'Banano Cavendish'),
  (gen_random_uuid(), 'NARA-005', 'Naranja Valencia'),
  (gen_random_uuid(), 'UVA-006', 'Uva Isabella'),
  (gen_random_uuid(), 'AGUA-007', 'Aguacate Hass'),
  (gen_random_uuid(), 'MANG-008', 'Mango Tommy'),
  (gen_random_uuid(), 'PAPA-009', 'Papa Criolla'),
  (gen_random_uuid(), 'CEBO-010', 'Cebolla Cabezona'),
  (gen_random_uuid(), 'TOMA-011', 'Tomate Chonto'),
  (gen_random_uuid(), 'LECH-012', 'Lechuga Crespa'),
  (gen_random_uuid(), 'ZANA-013', 'Zanahoria Larga'),
  (gen_random_uuid(), 'PIMI-014', 'Pimentón Rojo'),
  (gen_random_uuid(), 'BRO-015', 'Brócoli Floret'),
  (gen_random_uuid(), 'FRAM-016', 'Frambuesa Roja'),
  (gen_random_uuid(), 'CEB-017', 'Cebolla Junca'),
  (gen_random_uuid(), 'YUCA-018', 'Yuca Brava'),
  (gen_random_uuid(), 'PLAT-019', 'Plátano Verde'),
  (gen_random_uuid(), 'LIMO-020', 'Limón Tahití');

-- ============================================================
-- SHIPMENTS  (one per product, diverse statuses/destinations)
-- ============================================================
WITH s (sku, dest, status, time) AS MATERIALIZED (
  VALUES
    ('FRESA-001', 'Medellín',      'DELIVERED',     '2026-05-15T08:00:00Z'::timestamptz),
    ('MANZ-002',  'Cali',          'IN_TRANSIT',    '2026-05-17T08:00:00Z'::timestamptz),
    ('PERA-003',  'Barranquilla',  'DELIVERED',     '2026-05-14T06:00:00Z'::timestamptz),
    ('BANA-004',  'Cartagena',     'IN_TRANSIT',    '2026-05-18T08:00:00Z'::timestamptz),
    ('NARA-005',  'Bucaramanga',   'DELIVERED',     '2026-05-13T08:00:00Z'::timestamptz),
    ('UVA-006',   'Pereira',       'DELIVERED',     '2026-05-12T10:00:00Z'::timestamptz),
    ('AGUA-007',  'Cúcuta',        'IN_TRANSIT',    '2026-05-19T08:00:00Z'::timestamptz),
    ('MANG-008',  'Santa Marta',   'PENDING',       '2026-05-22T08:00:00Z'::timestamptz),
    ('PAPA-009',  'Ibagué',        'DELIVERED',     '2026-05-11T08:00:00Z'::timestamptz),
    ('CEBO-010',  'Villavicencio', 'DELIVERED',     '2026-05-10T08:00:00Z'::timestamptz),
    ('TOMA-011',  'Medellín',      'LOST',          '2026-05-16T08:00:00Z'::timestamptz),
    ('LECH-012',  'Cali',          'DELIVERED',     '2026-05-09T06:00:00Z'::timestamptz),
    ('ZANA-013',  'Barranquilla',  'IN_TRANSIT',    '2026-05-20T08:00:00Z'::timestamptz),
    ('PIMI-014',  'Cartagena',     'DELIVERED',     '2026-05-08T10:00:00Z'::timestamptz),
    ('BRO-015',   'Bucaramanga',   'PENDING',       '2026-05-21T08:00:00Z'::timestamptz),
    ('FRAM-016',  'Pereira',       'IN_TRANSIT',    '2026-05-19T08:00:00Z'::timestamptz),
    ('CEB-017',   'Cúcuta',        'DELIVERED',     '2026-05-07T08:00:00Z'::timestamptz),
    ('YUCA-018',  'Santa Marta',   'DELIVERED',     '2026-05-06T08:00:00Z'::timestamptz),
    ('PLAT-019',  'Ibagué',        'IN_TRANSIT',    '2026-05-21T08:00:00Z'::timestamptz),
    ('LIMO-020',  'Villavicencio', 'PENDING',       '2026-05-23T08:00:00Z'::timestamptz)
)
INSERT INTO shipments (id, product_id, status, current_location, updated_at)
SELECT gen_random_uuid(), p.id, s.status, s.dest, s.time
FROM s JOIN products p ON p.sku = s.sku;

-- ============================================================
-- SENSOR READINGS  (4 per shipment = 80)
-- ============================================================
-- FRESA-001 → Medellín (DELIVERED)  [cold chain berries]
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'FRESA-001')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-15T10:00:00Z'::timestamptz, 3.5, 88.0, 4.7110, -74.0721),
  ('2026-05-15T14:00:00Z'::timestamptz, 4.0, 85.0, 5.5000, -75.0000),
  ('2026-05-15T18:00:00Z'::timestamptz, 3.8, 82.0, 6.0000, -75.3000),
  ('2026-05-16T08:00:00Z'::timestamptz, 4.2, 80.0, 6.2476, -75.5658)
) AS v(ts,t,h,lat,lon);

-- MANZ-002 → Cali (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'MANZ-002')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-17T08:00:00Z'::timestamptz, 5.0, 82.0, 4.7110, -74.0721),
  ('2026-05-17T14:00:00Z'::timestamptz, 6.5, 78.0, 4.5000, -75.0000),
  ('2026-05-17T20:00:00Z'::timestamptz, 5.5, 80.0, 4.0000, -75.8000),
  ('2026-05-18T08:00:00Z'::timestamptz, 4.8, 85.0, 3.4516, -76.5320)
) AS v(ts,t,h,lat,lon);

-- PERA-003 → Barranquilla (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'PERA-003')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-14T06:00:00Z'::timestamptz, 6.0, 80.0, 4.7110, -74.0721),
  ('2026-05-14T16:00:00Z'::timestamptz, 7.5, 76.0, 7.0000, -74.5000),
  ('2026-05-15T06:00:00Z'::timestamptz, 5.8, 83.0, 9.0000, -74.7000),
  ('2026-05-15T16:00:00Z'::timestamptz, 6.2, 79.0, 10.9685, -74.7813)
) AS v(ts,t,h,lat,lon);

-- BANA-004 → Cartagena (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'BANA-004')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-18T08:00:00Z'::timestamptz, 12.0, 78.0, 4.7110, -74.0721),
  ('2026-05-18T16:00:00Z'::timestamptz, 14.5, 75.0, 7.0000, -74.6000),
  ('2026-05-19T08:00:00Z'::timestamptz, 13.0, 80.0, 9.0000, -75.0000),
  ('2026-05-19T16:00:00Z'::timestamptz, 15.0, 77.0, 10.3910, -75.5144)
) AS v(ts,t,h,lat,lon);

-- NARA-005 → Bucaramanga (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'NARA-005')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-13T08:00:00Z'::timestamptz, 10.0, 80.0, 4.7110, -74.0721),
  ('2026-05-13T18:00:00Z'::timestamptz, 12.5, 76.0, 5.5000, -74.0000),
  ('2026-05-14T08:00:00Z'::timestamptz, 9.8, 82.0, 6.5000, -73.5000),
  ('2026-05-14T18:00:00Z'::timestamptz, 11.0, 78.0, 7.1254, -73.1198)
) AS v(ts,t,h,lat,lon);

-- UVA-006 → Pereira (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'UVA-006')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-12T10:00:00Z'::timestamptz, 4.0, 85.0, 4.7110, -74.0721),
  ('2026-05-12T16:00:00Z'::timestamptz, 5.5, 82.0, 4.5000, -74.8000),
  ('2026-05-13T10:00:00Z'::timestamptz, 4.5, 88.0, 4.6000, -75.3000),
  ('2026-05-13T16:00:00Z'::timestamptz, 6.0, 80.0, 4.7111, -75.7669)
) AS v(ts,t,h,lat,lon);

-- AGUA-007 → Cúcuta (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'AGUA-007')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-19T08:00:00Z'::timestamptz, 10.0, 78.0, 4.7110, -74.0721),
  ('2026-05-19T16:00:00Z'::timestamptz, 12.0, 75.0, 5.5000, -73.5000),
  ('2026-05-20T08:00:00Z'::timestamptz, 11.5, 80.0, 6.5000, -73.0000),
  ('2026-05-20T16:00:00Z'::timestamptz, 13.0, 76.0, 7.8939, -72.5078)
) AS v(ts,t,h,lat,lon);

-- MANG-008 → Santa Marta (PENDING)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'MANG-008')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-22T08:00:00Z'::timestamptz, 14.0, 76.0, 4.7110, -74.0721),
  ('2026-05-22T16:00:00Z'::timestamptz, 16.5, 72.0, 4.7110, -74.0721),
  ('2026-05-23T08:00:00Z'::timestamptz, 13.5, 78.0, 4.7110, -74.0721),
  ('2026-05-23T16:00:00Z'::timestamptz, 15.0, 74.0, 4.7110, -74.0721)
) AS v(ts,t,h,lat,lon);

-- PAPA-009 → Ibagué (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'PAPA-009')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-11T08:00:00Z'::timestamptz, 8.0, 70.0, 4.7110, -74.0721),
  ('2026-05-11T16:00:00Z'::timestamptz, 10.0, 68.0, 4.5000, -74.8000),
  ('2026-05-12T08:00:00Z'::timestamptz, 7.5, 72.0, 4.4000, -75.0000),
  ('2026-05-12T16:00:00Z'::timestamptz, 9.5, 66.0, 4.4447, -75.2423)
) AS v(ts,t,h,lat,lon);

-- CEBO-010 → Villavicencio (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'CEBO-010')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-10T08:00:00Z'::timestamptz, 7.0, 72.0, 4.7110, -74.0721),
  ('2026-05-10T18:00:00Z'::timestamptz, 9.0, 68.0, 4.5000, -73.6000),
  ('2026-05-11T08:00:00Z'::timestamptz, 6.5, 75.0, 4.3000, -73.6000),
  ('2026-05-11T18:00:00Z'::timestamptz, 8.5, 70.0, 4.1420, -73.6266)
) AS v(ts,t,h,lat,lon);

-- TOMA-011 → Medellín (LOST)  — anomalous readings
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'TOMA-011')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-16T08:00:00Z'::timestamptz, 32.0, 25.0, 4.7110, -74.0721),
  ('2026-05-16T14:00:00Z'::timestamptz, 35.0, 20.0, 5.0000, -74.5000),
  ('2026-05-17T08:00:00Z'::timestamptz, 28.0, 35.0, 5.5000, -75.0000),
  ('2026-05-17T14:00:00Z'::timestamptz, 31.0, 28.0, 6.2476, -75.5658)
) AS v(ts,t,h,lat,lon);

-- LECH-012 → Cali (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'LECH-012')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-09T06:00:00Z'::timestamptz, 5.0, 82.0, 4.7110, -74.0721),
  ('2026-05-09T14:00:00Z'::timestamptz, 7.0, 78.0, 4.0000, -75.5000),
  ('2026-05-10T06:00:00Z'::timestamptz, 4.5, 85.0, 3.5000, -76.0000),
  ('2026-05-10T14:00:00Z'::timestamptz, 6.5, 80.0, 3.4516, -76.5320)
) AS v(ts,t,h,lat,lon);

-- ZANA-013 → Barranquilla (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'ZANA-013')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-20T08:00:00Z'::timestamptz, 6.0, 74.0, 4.7110, -74.0721),
  ('2026-05-20T16:00:00Z'::timestamptz, 8.0, 70.0, 7.0000, -74.5000),
  ('2026-05-21T08:00:00Z'::timestamptz, 5.5, 76.0, 9.0000, -74.7000),
  ('2026-05-21T16:00:00Z'::timestamptz, 7.5, 72.0, 10.9685, -74.7813)
) AS v(ts,t,h,lat,lon);

-- PIMI-014 → Cartagena (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'PIMI-014')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-08T10:00:00Z'::timestamptz, 8.0, 76.0, 4.7110, -74.0721),
  ('2026-05-08T18:00:00Z'::timestamptz, 10.0, 72.0, 7.0000, -74.6000),
  ('2026-05-09T10:00:00Z'::timestamptz, 7.5, 78.0, 9.0000, -75.0000),
  ('2026-05-09T18:00:00Z'::timestamptz, 9.5, 74.0, 10.3910, -75.5144)
) AS v(ts,t,h,lat,lon);

-- BRO-015 → Bucaramanga (PENDING)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'BRO-015')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-21T08:00:00Z'::timestamptz, 4.0, 82.0, 4.7110, -74.0721),
  ('2026-05-21T16:00:00Z'::timestamptz, 5.5, 78.0, 4.7110, -74.0721),
  ('2026-05-22T08:00:00Z'::timestamptz, 3.5, 86.0, 4.7110, -74.0721),
  ('2026-05-22T16:00:00Z'::timestamptz, 5.0, 80.0, 4.7110, -74.0721)
) AS v(ts,t,h,lat,lon);

-- FRAM-016 → Pereira (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'FRAM-016')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-19T08:00:00Z'::timestamptz, 2.5, 90.0, 4.7110, -74.0721),
  ('2026-05-19T14:00:00Z'::timestamptz, 3.0, 88.0, 4.5000, -74.8000),
  ('2026-05-20T08:00:00Z'::timestamptz, 1.8, 92.0, 4.6000, -75.3000),
  ('2026-05-20T14:00:00Z'::timestamptz, 2.8, 86.0, 4.7111, -75.7669)
) AS v(ts,t,h,lat,lon);

-- CEB-017 → Cúcuta (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'CEB-017')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-07T08:00:00Z'::timestamptz, 7.0, 74.0, 4.7110, -74.0721),
  ('2026-05-07T16:00:00Z'::timestamptz, 9.0, 70.0, 5.5000, -73.5000),
  ('2026-05-08T08:00:00Z'::timestamptz, 6.5, 76.0, 6.5000, -73.0000),
  ('2026-05-08T16:00:00Z'::timestamptz, 8.5, 72.0, 7.8939, -72.5078)
) AS v(ts,t,h,lat,lon);

-- YUCA-018 → Santa Marta (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'YUCA-018')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-06T08:00:00Z'::timestamptz, 9.0, 68.0, 4.7110, -74.0721),
  ('2026-05-06T18:00:00Z'::timestamptz, 11.0, 65.0, 7.0000, -74.5000),
  ('2026-05-07T08:00:00Z'::timestamptz, 8.5, 70.0, 9.0000, -74.2000),
  ('2026-05-07T18:00:00Z'::timestamptz, 10.5, 66.0, 11.2408, -74.1990)
) AS v(ts,t,h,lat,lon);

-- PLAT-019 → Ibagué (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'PLAT-019')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-21T08:00:00Z'::timestamptz, 13.0, 78.0, 4.7110, -74.0721),
  ('2026-05-21T16:00:00Z'::timestamptz, 15.0, 75.0, 4.5000, -74.8000),
  ('2026-05-22T08:00:00Z'::timestamptz, 12.5, 80.0, 4.4000, -75.0000),
  ('2026-05-22T16:00:00Z'::timestamptz, 14.0, 76.0, 4.4447, -75.2423)
) AS v(ts,t,h,lat,lon);

-- LIMO-020 → Villavicencio (PENDING)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'LIMO-020')
INSERT INTO sensor_readings (id, shipment_id, timestamp, temperaturec, humidity_pct, latitude, longitude, acknowledged)
SELECT gen_random_uuid(), sid.id, ts, t, h, lat, lon, true FROM sid,
(VALUES
  ('2026-05-23T08:00:00Z'::timestamptz, 10.0, 78.0, 4.7110, -74.0721),
  ('2026-05-23T16:00:00Z'::timestamptz, 12.0, 76.0, 4.7110, -74.0721),
  ('2026-05-24T08:00:00Z'::timestamptz, 9.5, 80.0, 4.7110, -74.0721),
  ('2026-05-24T16:00:00Z'::timestamptz, 11.0, 77.0, 4.7110, -74.0721)
) AS v(ts,t,h,lat,lon);

-- ============================================================
-- DELIVERY REPORTS  (one per DELIVERED shipment = 11)
-- ============================================================
WITH dr (sku, origin, dest, dispatch, delivery, avg_t, avg_h, t_alert, h_alert, status, obs) AS MATERIALIZED (
  VALUES
    ('FRESA-001', 'Bodega Central', 'Medellín',     '2026-05-15T08:00:00Z'::timestamptz, '2026-05-16T10:00:00Z'::timestamptz, 3.9, 83.8, false, true,  'ENTREGADO', 'Humedad elevada durante el trayecto, producto ok'),
    ('PERA-003',  'Bodega Central', 'Barranquilla', '2026-05-14T06:00:00Z'::timestamptz, '2026-05-15T20:00:00Z'::timestamptz, 6.4, 79.5, false, true,  'ENTREGADO', 'Envío completado con humedad ligeramente elevada'),
    ('NARA-005',  'Bodega Central', 'Bucaramanga',  '2026-05-13T08:00:00Z'::timestamptz, '2026-05-14T22:00:00Z'::timestamptz, 10.8, 79.0, false, true,  'ENTREGADO', 'Temperatura estable durante el trayecto'),
    ('UVA-006',   'Bodega Central', 'Pereira',      '2026-05-12T10:00:00Z'::timestamptz, '2026-05-13T20:00:00Z'::timestamptz, 5.0, 83.8, false, true,  'ENTREGADO', 'Humedad alta constante, producto sensible'),
    ('PAPA-009',  'Bodega Central', 'Ibagué',       '2026-05-11T08:00:00Z'::timestamptz, '2026-05-12T10:00:00Z'::timestamptz, 8.8, 69.0, false, false, 'ENTREGADO', 'Condiciones óptimas durante el envío'),
    ('CEBO-010',  'Bodega Central', 'Villavicencio','2026-05-10T08:00:00Z'::timestamptz, '2026-05-11T12:00:00Z'::timestamptz, 7.8, 71.3, false, false, 'ENTREGADO', 'Envío sin novedades'),
    ('TOMA-011',  'Bodega Central', 'Medellín',     '2026-05-16T08:00:00Z'::timestamptz, '2026-05-17T18:00:00Z'::timestamptz, 31.5, 27.0, true,  true,  'PERDIDO',   'Cadena de frío rota — producto perdido'),
    ('LECH-012',  'Bodega Central', 'Cali',         '2026-05-09T06:00:00Z'::timestamptz, '2026-05-10T18:00:00Z'::timestamptz, 5.8, 81.3, false, true,  'ENTREGADO', 'Lechuga entregada en buen estado'),
    ('PIMI-014',  'Bodega Central', 'Cartagena',    '2026-05-08T10:00:00Z'::timestamptz, '2026-05-09T22:00:00Z'::timestamptz, 8.8, 75.0, false, false, 'ENTREGADO', 'Pimentón entregado sin novedades'),
    ('CEB-017',   'Bodega Central', 'Cúcuta',       '2026-05-07T08:00:00Z'::timestamptz, '2026-05-08T20:00:00Z'::timestamptz, 7.8, 73.0, false, false, 'ENTREGADO', 'Cebolla junca entregada a tiempo'),
    ('YUCA-018',  'Bodega Central', 'Santa Marta',  '2026-05-06T08:00:00Z'::timestamptz, '2026-05-08T06:00:00Z'::timestamptz, 9.8, 67.3, false, false, 'ENTREGADO', 'Yuca entregada en óptimas condiciones')
)
INSERT INTO delivery_reports (report_id, shipment_id, product_id, origin, destination, dispatch_time, delivery_time, average_temperature, average_humidity, temperature_alert, humidity_alert, delivery_status, observations)
SELECT gen_random_uuid(), s.id, p.id, dr.origin, dr.dest, dr.dispatch, dr.delivery, dr.avg_t, dr.avg_h, dr.t_alert, dr.h_alert, dr.status, dr.obs
FROM dr
JOIN products p ON p.sku = dr.sku
JOIN shipments s ON s.product_id = p.id;

-- ============================================================
-- SHIPPING COSTS  (pre-computed with RATE_PER_KM=2000)
-- ============================================================
-- Cost formula: base=50000, distance_cost=km*2000, extra=alerts*15000, total=sum
-- Distances (km) from WAREHOUSE (Bogotá):
--   Medellín=240, Cali=300, Barranquilla=700, Cartagena=660
--   Bucaramanga=390, Pereira=200, Cúcuta=560, Santa Marta=760
--   Ibagué=130, Villavicencio=90
WITH sc (sku, km, alerts, base, extra) AS MATERIALIZED (
  VALUES
    ('FRESA-001', 240, 3, 50000,  45000),
    ('MANZ-002',  300, 1, 50000,  15000),
    ('PERA-003',  700, 1, 50000,  15000),
    ('BANA-004',  660, 0, 50000,      0),
    ('NARA-005',  390, 1, 50000,  15000),
    ('UVA-006',   200, 2, 50000,  30000),
    ('AGUA-007',  560, 0, 50000,      0),
    ('MANG-008',  760, 0, 50000,      0),
    ('PAPA-009',  130, 0, 50000,      0),
    ('CEBO-010',   90, 0, 50000,      0),
    ('TOMA-011',  240, 4, 50000,  60000),
    ('LECH-012',  300, 2, 50000,  30000),
    ('ZANA-013',  700, 0, 50000,      0),
    ('PIMI-014',  660, 0, 50000,      0),
    ('BRO-015',   390, 2, 50000,  30000),
    ('FRAM-016',  200, 3, 50000,  45000),
    ('CEB-017',   560, 0, 50000,      0),
    ('YUCA-018',  760, 0, 50000,      0),
    ('PLAT-019',  130, 0, 50000,      0),
    ('LIMO-020',   90, 0, 50000,      0)
)
INSERT INTO shipping_costs (id, shipment_id, base_rate, distance_km, distance_cost, extra_charges, total_cost, currency, calculated_at, strategy_name)
SELECT
  gen_random_uuid(), s.id,
  sc.base,
  sc.km,
  ROUND(sc.km * 2000.0, 2),
  sc.extra,
  sc.base + ROUND(sc.km * 2000.0, 2) + sc.extra,
  'COP',
  '2026-05-24T12:00:00Z'::timestamptz,
  'Standard'
FROM sc
JOIN products p ON p.sku = sc.sku
JOIN shipments s ON s.product_id = p.id;

-- ============================================================
-- INVENTORY ITEMS  (one per product, Bodega Central)
-- ============================================================
WITH inv (sku, qty, min_stk) AS MATERIALIZED (
  VALUES
    ('FRESA-001', 500,  50),
    ('MANZ-002',  800,  80),
    ('PERA-003',  600,  60),
    ('BANA-004',  1200, 100),
    ('NARA-005',  900,  90),
    ('UVA-006',   400,  40),
    ('AGUA-007',  300,  30),
    ('MANG-008',  350,  35),
    ('PAPA-009',  2000, 200),
    ('CEBO-010',  1500, 150),
    ('TOMA-011',  700,  70),
    ('LECH-012',  300,  30),
    ('ZANA-013',  850,  85),
    ('PIMI-014',  450,  45),
    ('BRO-015',   250,  25),
    ('FRAM-016',  200,  20),
    ('CEB-017',   400,  40),
    ('YUCA-018',  1000, 100),
    ('PLAT-019',  600,  60),
    ('LIMO-020',  550,  55)
)
INSERT INTO inventory_items (id, product_id, quantity, min_stock, warehouse, last_updated)
SELECT gen_random_uuid(), p.id, inv.qty, inv.min_stk, 'Bodega Central', '2026-05-24T08:00:00Z'::timestamptz
FROM inv JOIN products p ON p.sku = inv.sku;

-- ============================================================
-- STOCK MOVEMENTS  (initial stock entry for each product)
-- ============================================================
INSERT INTO stock_movements (id, product_id, type, quantity, reference, notes, timestamp)
SELECT gen_random_uuid(), p.id, 'INITIAL', inv.qty, 'INVENTARIO_INICIAL', 'Stock inicial ' || p.name, '2026-05-24T08:00:00Z'::timestamptz
FROM products p
JOIN (VALUES
  ('FRESA-001', 500), ('MANZ-002', 800), ('PERA-003', 600), ('BANA-004', 1200),
  ('NARA-005', 900), ('UVA-006', 400), ('AGUA-007', 300), ('MANG-008', 350),
  ('PAPA-009', 2000), ('CEBO-010', 1500), ('TOMA-011', 700), ('LECH-012', 300),
  ('ZANA-013', 850), ('PIMI-014', 450), ('BRO-015', 250), ('FRAM-016', 200),
  ('CEB-017', 400), ('YUCA-018', 1000), ('PLAT-019', 600), ('LIMO-020', 550)
) AS inv(sku, qty) ON p.sku = inv.sku;

-- ============================================================
-- QUALITY CHECKPOINTS  (one per shipment)
-- ============================================================
-- WAREHOUSE exit inspection for all shipments
INSERT INTO quality_checkpoints (id, shipment_id, location, temperature_c, humidity_pct, passed, notes, inspector, timestamp)
SELECT gen_random_uuid(), s.id, loc, temp, hum, pass, note, insp, ts
FROM shipments s
JOIN products p ON s.product_id = p.id
JOIN (VALUES
  ('FRESA-001', 'Bodega Central',  3.2, 89.0, true,  'Fresa en óptimas condiciones al salir',     'Carlos López',   '2026-05-15T08:00:00Z'::timestamptz),
  ('MANZ-002',  'Bodega Central',  5.5, 83.0, true,  'Manzana firme, temperatura correcta',        'Ana Martínez',   '2026-05-17T08:00:00Z'::timestamptz),
  ('PERA-003',  'Bodega Central',  5.8, 81.0, true,  'Pera verde lista para envío',                'Carlos López',   '2026-05-14T06:00:00Z'::timestamptz),
  ('BANA-004',  'Bodega Central',  11.5,79.0, true,  'Banano en punto de maduración',              'Pedro Gómez',    '2026-05-18T08:00:00Z'::timestamptz),
  ('NARA-005',  'Bodega Central',  9.5, 81.0, true,  'Naranja fresca, sin daños',                  'Ana Martínez',   '2026-05-13T08:00:00Z'::timestamptz),
  ('UVA-006',   'Bodega Central',  4.5, 86.0, true,  'Uva entera, humedad controlada',             'Carlos López',   '2026-05-12T10:00:00Z'::timestamptz),
  ('AGUA-007',  'Bodega Central',  9.8, 79.0, true,  'Aguacate en maduración controlada',          'Pedro Gómez',    '2026-05-19T08:00:00Z'::timestamptz),
  ('MANG-008',  'Bodega Central',  13.5,77.0, true,  'Mango verde, listo para despacho',           'Ana Martínez',   '2026-05-22T08:00:00Z'::timestamptz),
  ('PAPA-009',  'Bodega Central',  7.8, 71.0, true,  'Papa criolla seleccionada',                  'Carlos López',   '2026-05-11T08:00:00Z'::timestamptz),
  ('CEBO-010',  'Bodega Central',  6.8, 73.0, true,  'Cebolla seca, buen estado',                  'Pedro Gómez',    '2026-05-10T08:00:00Z'::timestamptz),
  ('TOMA-011',  'Bodega Central',  4.5, 80.0, true,  'Tomate maduro pero firme — ok al salir',     'Ana Martínez',   '2026-05-16T08:00:00Z'::timestamptz),
  ('LECH-012',  'Bodega Central',  4.8, 83.0, true,  'Lechuga fresca, hidratada',                  'Carlos López',   '2026-05-09T06:00:00Z'::timestamptz),
  ('ZANA-013',  'Bodega Central',  5.5, 75.0, true,  'Zanahoria larga seleccionada',               'Pedro Gómez',    '2026-05-20T08:00:00Z'::timestamptz),
  ('PIMI-014',  'Bodega Central',  7.5, 77.0, true,  'Pimentón rojo en óptimo estado',             'Ana Martínez',   '2026-05-08T10:00:00Z'::timestamptz),
  ('BRO-015',   'Bodega Central',  3.8, 83.0, true,  'Brócoli fresco, refrigerado correctamente',  'Carlos López',   '2026-05-21T08:00:00Z'::timestamptz),
  ('FRAM-016',  'Bodega Central',  2.2, 91.0, true,  'Frambuesa delicada, empaque correcto',       'Pedro Gómez',    '2026-05-19T08:00:00Z'::timestamptz),
  ('CEB-017',   'Bodega Central',  6.5, 75.0, true,  'Cebolla junca fresca',                       'Ana Martínez',   '2026-05-07T08:00:00Z'::timestamptz),
  ('YUCA-018',  'Bodega Central',  8.5, 69.0, true,  'Yuca brava, sin defectos',                   'Carlos López',   '2026-05-06T08:00:00Z'::timestamptz),
  ('PLAT-019',  'Bodega Central',  12.5,79.0, true,  'Plátano verde listo para envío',             'Pedro Gómez',    '2026-05-21T08:00:00Z'::timestamptz),
  ('LIMO-020',  'Bodega Central',  9.5, 79.0, true,  'Limón tahití fresco, sin moho',              'Ana Martínez',   '2026-05-23T08:00:00Z'::timestamptz)
) AS v(sku, loc, temp, hum, pass, note, insp, ts) ON p.sku = v.sku;

-- ============================================================
-- SHIPMENT EVENTS  (status transitions)
-- ============================================================
-- DELIVERED: PENDING → IN_TRANSIT → DELIVERED
-- IN_TRANSIT: PENDING → IN_TRANSIT
-- PENDING: (none, already PENDING)
-- LOST: PENDING → IN_TRANSIT → LOST

-- FRESA-001 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'FRESA-001')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,         'Bodega Central',  '2026-05-15T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Medellín',    '2026-05-15T08:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Medellín',   'Medellín',        '2026-05-16T10:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- MANZ-002 (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'MANZ-002')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,         'Bodega Central',  '2026-05-17T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Cali',        '2026-05-17T08:30:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- PERA-003 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'PERA-003')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-14T06:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Barranquilla',   '2026-05-14T06:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Barranquilla',   'Barranquilla',   '2026-05-15T20:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- BANA-004 (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'BANA-004')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-18T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Cartagena',      '2026-05-18T08:30:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- NARA-005 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'NARA-005')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-13T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Bucaramanga',    '2026-05-13T08:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Bucaramanga',   'Bucaramanga',     '2026-05-14T22:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- UVA-006 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'UVA-006')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-12T10:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Pereira',        '2026-05-12T10:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Pereira',        'Pereira',        '2026-05-13T20:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- AGUA-007 (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'AGUA-007')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-19T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Cúcuta',         '2026-05-19T08:30:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- MANG-008 (PENDING) — just one event showing it was created
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'MANG-008')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, NULL, 'PENDING', NULL, 'Bodega Central', '2026-05-22T08:00:00Z'::timestamptz FROM sid;

-- PAPA-009 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'PAPA-009')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-11T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Ibagué',         '2026-05-11T08:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Ibagué',         'Ibagué',         '2026-05-12T10:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- CEBO-010 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'CEBO-010')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,                'Bodega Central',     '2026-05-10T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central',    'Villavicencio',      '2026-05-10T08:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Villavicencio',     'Villavicencio',      '2026-05-11T12:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- TOMA-011 (LOST)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'TOMA-011')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-16T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Medellín',       '2026-05-16T08:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'LOST',       'Medellín',       'Medellín',       '2026-05-17T18:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- LECH-012 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'LECH-012')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-09T06:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Cali',           '2026-05-09T06:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Cali',           'Cali',           '2026-05-10T18:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- ZANA-013 (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'ZANA-013')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-20T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Barranquilla',   '2026-05-20T08:30:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- PIMI-014 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'PIMI-014')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-08T10:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Cartagena',      '2026-05-08T10:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Cartagena',      'Cartagena',      '2026-05-09T22:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- BRO-015 (PENDING)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'BRO-015')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, NULL, 'PENDING', NULL, 'Bodega Central', '2026-05-21T08:00:00Z'::timestamptz FROM sid;

-- FRAM-016 (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'FRAM-016')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-19T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Pereira',        '2026-05-19T08:30:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- CEB-017 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'CEB-017')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-07T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Cúcuta',         '2026-05-07T08:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Cúcuta',         'Cúcuta',         '2026-05-08T20:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- YUCA-018 (DELIVERED)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'YUCA-018')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-06T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Santa Marta',    '2026-05-06T08:30:00Z'::timestamptz),
  ('IN_TRANSIT',  'DELIVERED',  'Santa Marta',    'Santa Marta',    '2026-05-08T06:00:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- PLAT-019 (IN_TRANSIT)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'PLAT-019')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, fs, ts, fl, tl, t FROM sid,
(VALUES
  (NULL,          'PENDING',    NULL,             'Bodega Central',  '2026-05-21T08:00:00Z'::timestamptz),
  ('PENDING',     'IN_TRANSIT', 'Bodega Central', 'Ibagué',         '2026-05-21T08:30:00Z'::timestamptz)
) AS v(fs,ts,fl,tl,t);

-- LIMO-020 (PENDING)
WITH sid AS (SELECT s.id FROM shipments s JOIN products p ON s.product_id = p.id WHERE p.sku = 'LIMO-020')
INSERT INTO shipment_events (id, shipment_id, from_status, to_status, from_location, to_location, timestamp)
SELECT gen_random_uuid(), sid.id, NULL, 'PENDING', NULL, 'Bodega Central', '2026-05-23T08:00:00Z'::timestamptz FROM sid;
