package com.cadenasuministros.application.factory;

import com.cadenasuministros.application.usecase.RegisterSensorReadingService;
import com.cadenasuministros.domain.port.in.RegisterSensorReadingUseCase;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;

import org.springframework.context.ApplicationEventPublisher;

public class RegisterSensorReadingServiceFactory
        extends RegisterSensorReadingUseCaseFactory {

    private final SensorReadingRepository sensorReadingRepository;
    private final ApplicationEventPublisher eventPublisher;

    public RegisterSensorReadingServiceFactory(
            SensorReadingRepository sensorReadingRepository,
            ApplicationEventPublisher eventPublisher) {
        this.sensorReadingRepository = sensorReadingRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    protected RegisterSensorReadingUseCase buildUseCase() {
        return new RegisterSensorReadingService(sensorReadingRepository, eventPublisher);
    }
}
