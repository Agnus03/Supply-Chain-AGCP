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
import com.cadenasuministros.domain.service.GenerateDeliveryReportService;

@Configuration
public class FactoryConfig {

    @Bean
    TrackShipmentUseCaseFactory trackShipmentUseCaseFactory(
            ShipmentRepository shipmentRepository) {
        return new TrackShipmentServiceFactory(shipmentRepository);
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
    GenerateDeliveryReportUseCase generateDeliveryReportUseCase(
            ShipmentRepository shipmentRepository,
            SensorReadingRepository sensorReadingRepository,
            DeliveryReportRepository deliveryReportRepository) {
        return new GenerateDeliveryReportService(
            shipmentRepository, 
            sensorReadingRepository, 
            deliveryReportRepository
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
            ProductRepository productRepository) {
        return new SupplyChainFacadeImpl(
                trackShipmentUseCase,
                registerSensorReadingUseCase,
                generateDeliveryReportUseCase,
                sensorReadingRepository,
                productRepository);
    }
}