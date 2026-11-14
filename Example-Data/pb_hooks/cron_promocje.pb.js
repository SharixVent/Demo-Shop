/// <reference path="../types.d.ts" />

cronAdd("reset_expired_promotions", "0 0 * * *", () => {
    // Runs daily at 00:00 (midnight)
    console.log("[CRON] Starting verification of expired product promotions...");

    try {
        $app.db()
            .newQuery("UPDATE items SET sale_price = null, sale_end_date = '' WHERE sale_end_date < datetime('now') AND sale_end_date != ''")
            .execute();

        console.log("[CRON] Expired promotions have been cleared successfully!");
    } catch (err) {
        console.error("[CRON] Error while clearing expired promotions:", err);
    }
});