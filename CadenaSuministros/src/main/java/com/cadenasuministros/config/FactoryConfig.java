package com.cadenasuministros.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cadenasuministros.adapters.outbound.persistence.jpa.JpaAdapters;
import com.cadenasuministros.adapters.outbound.persistence.jpa.SpringDataDeliveryReportRepository;
import com.cadenasuministros.adapters.outbound.persistence.jpa.SpringDataSensorReadingRepository;
import com.cadenasuministros.adapters.outbound.persistence.jpa.SpringDataShipmentRepository;
import com.cadenasuministros.adapters.outbound.persistence.jpa.SpringDataProductRepository;
import com.cadenasuministros.application.facade.SupplyChainFacade;
import com.cadenasuministros.application.facade.SupplyChainFacadeImpl;
import com.cadenasuministros.application.factory.*;
import com.cadenasuministros.application.reporting.abstraction.DeliveryReportGenerator;
import com.cadenasuministros.application.reporting.abstraction.DetailedDeliveryReportGenerator;
import com.cadenasuministros.application.reporting.decorator.LoggingReportDecorator;
import com.cadenasuministros.application.reporting.decorator.ValidationReportDecorator;
import com.cadenasuministros.application.reporting.implementor.JpaReportOutput;
import com.cadenasuministros.application.reporting.implementor.ReportOutput;
import com.cadenasuministros.domain.port.in.*;
import com.cadenasuministros.domain.port.out.*;
import com.cadenasuministros.domain.service.AlertEvaluator;
import com.cadenasuministros.domain.service.GenerateDeliveryReportService;

@Configuration
public class FactoryConfig {

    @Bean
    TrackShipmentUseCaseFactory trackShipmentUseCaseFactory(
            ShipmentRepository shipmentRepository,
            ShipmentEventRepository shipmentEventRepository) {
        return new TrackShipmentServiceFactory(shipmentRepository, shipmentEventRepository);
    }

    @Bean
    RegisterSensorReadingUseCaseFactory registerSensorReadingUseCaseFactory(
            SensorReadingRepository sensorReadingRepository) {
        return new RegisterSensorReadingServiceFactory(sensorReadingRepository);
    }

    @Bean
    SupplyChainUseCaseAbstractFactory supplyChainUseCaseAbstractFactory(
            TrackShipmentUseCaseFactory trackFactory,
            RegisterSensorReadingUseCaseFactory sensorFactory) {

        return new DefaultSupplyChainUseCaseFactory(trackFactory, sensorFactory);
    }

    @Bean
    TrackShipmentUseCase trackShipmentUseCase(
            SupplyChainUseCaseAbstractFactory factory) {
        return factory.createTrackShipmentUseCase();
    }

    @Bean
    RegisterSensorReadingUseCase registerSensorReadingUseCase(
            SupplyChainUseCaseAbstractFactory factory) {
        return factory.createRegisterSensorReadingUseCase();
    }
    
    @Bean
    JpaAdapters jpaAdapters(
            SpringDataShipmentRepository shipmentRepo,
            SpringDataSensorReadingRepository sensorRepo,
            SpringDataDeliveryReportRepository reportRepo,
            SpringDataProductRepository productRepo) {  
        return new JpaAdapters(shipmentRepo, sensorRepo, reportRepo, productRepo);
    }
    
    @Bean
    AlertEvaluator alertEvaluator(AlertProperties alertProperties) {
        return new AlertEvaluator(
            alertProperties.getTemperature().getMin(),
            alertProperties.getTemperature().getMax(),
            alertProperties.getHumidity().getMin(),
            alertProperties.getHumidity().getMax()
        );
    }

    @Bean
    GenerateDeliveryReportUseCase generateDeliveryReportUseCase(
            ShipmentRepository shipmentRepository,
            SensorReadingRepository sensorReadingRepository,
            DeliveryReportRepository deliveryReportRepository,
            AlertEvaluator alertEvaluator) {
        return new GenerateDeliveryReportService(
            shipmentRepository, 
            sensorReadingRepository, 
            deliveryReportRepository,
            alertEvaluator
        );
    }
    
    @Bean
    DeliveryReportGenerator deliveryReportGenerator(
            DeliveryReportRepository repo) {

        // Bridge
        DeliveryReportGenerator base =
            new DetailedDeliveryReportGenerator(
                new JpaReportOutput(repo)
            );

        // Decorators
        DeliveryReportGenerator withLogs =
            new LoggingReportDecorator(base);

        DeliveryReportGenerator withValidation =
            new ValidationReportDecorator(withLogs);

        return withValidation;
    }

    @Bean
    SupplyChainFacade supplyChainFacade(
            TrackShipmentUseCase trackShipmentUseCase,
            RegisterSensorReadingUseCase registerSensorReadingUseCase,
            GenerateDeliveryReportUseCase generateDeliveryReportUseCase,
            SensorReadingRepository sensorReadingRepository,
            ProductRepository productRepository,
            AlertEvaluator alertEvaluator) {
        return new SupplyChainFacadeImpl(
                trackShipmentUseCase,
                registerSensorReadingUseCase,
                generateDeliveryReportUseCase,
                sensorReadingRepository,
                productRepository,
                alertEvaluator);
    }
}