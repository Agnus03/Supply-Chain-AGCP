package com.cadenasuministros.application.usecase;

import java.util.List;

import com.cadenasuministros.domain.event.SensorReadingRegisteredEvent;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.port.in.RegisterSensorReadingUseCase;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;

import org.springframework.context.ApplicationEventPublisher;

public class RegisterSensorReadingService implements RegisterSensorReadingUseCase {

    private final SensorReadingRepository sensorReadingRepository;
    private final ApplicationEventPublisher eventPublisher;

    public RegisterSensorReadingService(
            SensorReadingRepository sensorReadingRepository,
            ApplicationEventPublisher eventPublisher) {
        this.sensorReadingRepository = sensorReadingRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public SensorReading register(SensorReading reading) {
        SensorReading saved = sensorReadingRepository.save(reading);
        eventPublisher.publishEvent(new SensorReadingRegisteredEvent(saved));
        return saved;
    }

	@Override
	public List<SensorReading> listAll() {
		return sensorReadingRepository.listAll();
	}

}
