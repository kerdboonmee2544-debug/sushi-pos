CREATE TABLE `product_categories` (
	`id` char(36) NOT NULL,
	`shop_id` char(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_categories_shop_name_uq` UNIQUE(`shop_id`,`name`)
);
--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_shop_id_shops_id_fk` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO `product_categories` (`id`, `shop_id`, `name`)
SELECT UUID(), `shop_id`, `category`
FROM `products`
WHERE `category` IS NOT NULL AND TRIM(`category`) <> ''
GROUP BY `shop_id`, `category`;
