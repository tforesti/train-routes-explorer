CREATE TABLE "route_stations" (
	"route_id" text NOT NULL,
	"station_id" text NOT NULL,
	"sequence" integer NOT NULL,
	CONSTRAINT "route_stations_route_id_sequence_pk" PRIMARY KEY("route_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "route_stations" ADD CONSTRAINT "route_stations_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stations" ADD CONSTRAINT "route_stations_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_route_stations_route_id" ON "route_stations" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "idx_stations_lat_lon" ON "stations" USING btree ("lat","lon");