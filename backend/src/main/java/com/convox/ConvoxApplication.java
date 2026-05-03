package com.convox;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
@EnableAsync
public class ConvoxApplication {

	public static void main(String[] args) {
		SpringApplication.run(ConvoxApplication.class, args);
	}

	@Bean
	public CommandLineRunner fixDatabaseSchema(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {

				jdbcTemplate.execute("ALTER TABLE chat_messages MODIFY COLUMN image_url LONGTEXT");
				jdbcTemplate.execute("ALTER TABLE chat_messages MODIFY COLUMN content LONGTEXT");

			} catch (Exception e) {
				System.err.println("Database schema update failed or already applied: " + e.getMessage());
			}
		};
	}

	@Bean(name = "taskExecutor")
	public java.util.concurrent.Executor taskExecutor() {
		org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor executor = new org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor();
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(5);
		executor.setQueueCapacity(500);
		executor.setThreadNamePrefix("EmailThread-");
		executor.initialize();
		return executor;
	}
}
