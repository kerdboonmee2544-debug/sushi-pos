CREATE TABLE `ingredient_movements` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`ingredient_id` char(36) NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`type` enum('receive','use','adjustment','waste') NOT NULL,
	`note` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredient_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`unit` varchar(30) NOT NULL,
	`quantity` decimal(12,3) NOT NULL DEFAULT '0',
	`minimum_quantity` decimal(12,3) NOT NULL DEFAULT '0',
	`current_price` decimal(12,2) NOT NULL DEFAULT '0',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(150) NOT NULL,
	`tier` enum('Silver','Gold','Platinum') NOT NULL DEFAULT 'Silver',
	`discount_percent` decimal(5,2) NOT NULL DEFAULT '0',
	`total_spent` decimal(12,2) NOT NULL DEFAULT '0',
	`points` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_shop_phone_uq` UNIQUE(`shop_id`,`phone`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` char(36) NOT NULL,
	`order_id` char(36) NOT NULL,
	`product_id` char(36),
	`product_name` varchar(150) NOT NULL,
	`unit_price` decimal(12,2) NOT NULL,
	`quantity` int NOT NULL,
	`line_total` decimal(12,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` char(36) NOT NULL,
	`order_number` varchar(40) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`member_id` char(36),
	`customer_reference` varchar(100),
	`subtotal` decimal(12,2) NOT NULL,
	`promotion_discount` decimal(12,2) NOT NULL DEFAULT '0',
	`member_discount` decimal(12,2) NOT NULL DEFAULT '0',
	`total` decimal(12,2) NOT NULL,
	`status` enum('pending','preparing','completed','cancelled') NOT NULL DEFAULT 'pending',
	`created_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_number_uq` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` char(36) NOT NULL,
	`order_id` char(36) NOT NULL,
	`method` enum('cash','promptpay','card','other') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`received_amount` decimal(12,2),
	`change_amount` decimal(12,2) NOT NULL DEFAULT '0',
	`status` enum('pending','paid','refunded','voided') NOT NULL DEFAULT 'paid',
	`received_by` char(36),
	`paid_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`price` decimal(12,2) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`tag` varchar(50),
	`image_url` varchar(500),
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`type` enum('percent','fixed') NOT NULL,
	`value` decimal(12,2) NOT NULL,
	`min_spend` decimal(12,2) NOT NULL DEFAULT '0',
	`active` boolean NOT NULL DEFAULT true,
	`starts_at` timestamp,
	`ends_at` timestamp,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` char(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`slogan` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`username` varchar(100) NOT NULL,
	`name` varchar(150) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('cashier','kitchen','manager','admin') NOT NULL,
	`image_url` varchar(500),
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_shop_username_uq` UNIQUE(`shop_id`,`username`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`product_id` char(36) NOT NULL,
	`order_id` char(36),
	`type` enum('sale','receive','adjustment','void','waste') NOT NULL,
	`quantity` int NOT NULL,
	`note` varchar(255),
	`created_by` char(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ingredient_movements` ADD CONSTRAINT `ingredient_movements_ingredient_id_ingredients_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingredients` ADD CONSTRAINT `ingredients_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_created_by_staff_id_fk` FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_received_by_staff_id_fk` FOREIGN KEY (`received_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promotions` ADD CONSTRAINT `promotions_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `staff` ADD CONSTRAINT `staff_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_created_by_staff_id_fk` FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ingredients_shop_idx` ON `ingredients` (`shop_id`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_shop_created_idx` ON `orders` (`shop_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `products_shop_idx` ON `products` (`shop_id`);--> statement-breakpoint
CREATE INDEX `promotions_shop_active_idx` ON `promotions` (`shop_id`,`active`);--> statement-breakpoint
CREATE INDEX `stock_movements_product_idx` ON `stock_movements` (`product_id`,`created_at`);