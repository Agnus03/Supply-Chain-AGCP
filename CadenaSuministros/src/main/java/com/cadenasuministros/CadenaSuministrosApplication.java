package com.cadenasuministros;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CadenaSuministrosApplication {

	public static void main(String[] args) {
		SpringApplication.run(CadenaSuministrosApplication.class, args);
	}

}
