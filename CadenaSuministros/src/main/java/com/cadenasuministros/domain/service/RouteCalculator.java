package com.cadenasuministros.domain.service;

import com.cadenasuministros.domain.model.RouteInfo;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
public class RouteCalculator {

    private static final double AVG_SPEED_KMH = 60.0;
    private static final double AVG_SPEED_TRUCK_KMH = 50.0;

    private static final Map<String, double[]> CITY_COORDS = Map.ofEntries(
        Map.entry("Bogotá", new double[]{4.7110, -74.0721}),
        Map.entry("Medellín", new double[]{6.2476, -75.5658}),
        Map.entry("Cali", new double[]{3.4516, -76.5320}),
        Map.entry("Barranquilla", new double[]{10.9685, -74.7813}),
        Map.entry("Cartagena", new double[]{10.3910, -75.5144}),
        Map.entry("Cúcuta", new double[]{7.8939, -72.5078}),
        Map.entry("Bucaramanga", new double[]{7.1193, -73.1227}),
        Map.entry("Pereira", new double[]{4.8133, -75.6961}),
        Map.entry("Santa Marta", new double[]{11.2408, -74.1990}),
        Map.entry("Manizales", new double[]{5.0703, -75.5178}),
        Map.entry("WAREHOUSE", new double[]{4.6243, -74.0636}),
        Map.entry("RUTA-25", new double[]{5.0703, -75.5178}),
        Map.entry("RUTA-40", new double[]{4.8133, -75.6961}),
        Map.entry("RUTA-60", new double[]{3.4516, -76.5320}),
        Map.entry("RUTA-80", new double[]{6.2476, -75.5658})
    );

    public double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private double[] lookupCoords(String city) {
        double[] coords = CITY_COORDS.get(city);
        if (coords == null) {
            throw new IllegalArgumentException("Ciudad no encontrada: " + city
                    + ". Ciudades disponibles: " + CITY_COORDS.keySet());
        }
        return coords;
    }

    public RouteInfo calculate(String origin, String destination) {
        double[] o = lookupCoords(origin);
        double[] d = lookupCoords(destination);
        double distKm = haversine(o[0], o[1], d[0], d[1]);
        double estimatedHours = distKm / AVG_SPEED_TRUCK_KMH;
        Instant eta = Instant.now().plus((long) (estimatedHours * 3600), ChronoUnit.SECONDS);
        return new RouteInfo(origin, destination, Math.round(distKm * 10.0) / 10.0,
                Math.round(estimatedHours * 10.0) / 10.0, eta);
    }

    public double calculateDistance(String origin, String destination) {
        double[] o = lookupCoords(origin);
        double[] d = lookupCoords(destination);
        double distKm = haversine(o[0], o[1], d[0], d[1]);
        return Math.round(distKm * 10.0) / 10.0;
    }
}
