package com.cadenasuministros.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "alert")
public class AlertProperties {

    private Temperature temperature = new Temperature();
    private Humidity humidity = new Humidity();

    public Temperature getTemperature() { return temperature; }
    public void setTemperature(Temperature temperature) { this.temperature = temperature; }

    public Humidity getHumidity() { return humidity; }
    public void setHumidity(Humidity humidity) { this.humidity = humidity; }

    public static class Temperature {
        private double min = 2.0;
        private double max = 30.0;

        public double getMin() { return min; }
        public void setMin(double min) { this.min = min; }
        public double getMax() { return max; }
        public void setMax(double max) { this.max = max; }
    }

    public static class Humidity {
        private double min = 30.0;
        private double max = 80.0;

        public double getMin() { return min; }
        public void setMin(double min) { this.min = min; }
        public double getMax() { return max; }
        public void setMax(double max) { this.max = max; }
    }
}
