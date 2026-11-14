/// <reference path="../types.d.ts" />

console.log("[p24.payment.pb.js] Loading Przelewy24 Payment Module (Register + Webhook | PB v0.23+)");

// =================================================================
// 1. ENDPOINT: REGISTER TRANSACTION (Called from React Checkout)
// =================================================================
routerAdd("POST", "/api/p24/register", (e) => {
    try {
        const info = e.requestInfo();
        const data = info.body;

        if (!data || !data.orderId) {
            throw new Error("Invalid JSON payload received from checkout.");
        }

        const orderId = String(data.orderId);
        const amount = Number(data.amount);
        const email = data.email || "customer@example.com";

        // Read sensitive credentials from environment variables (with safe dummy fallbacks)
        const P24_MERCHANT_ID = Number($os.getenv("P24_MERCHANT_ID") || 100000);
        const P24_POS_ID = Number($os.getenv("P24_POS_ID") || P24_MERCHANT_ID);
        const P24_CRC = $os.getenv("P24_CRC") || "your_p24_crc_key_here";
        const P24_API_KEY = $os.getenv("P24_API_KEY") || "your_p24_api_key_here";
        const IS_SANDBOX = $os.getenv("P24_IS_SANDBOX") === "true";

        const STORE_URL = ($os.getenv("STORE_URL") || "https://example.com").replace(/\/$/, "");
        const BACKEND_URL = ($os.getenv("BACKEND_URL") || STORE_URL).replace(/\/$/, "");
        const P24_BASE_URL = IS_SANDBOX
            ? "https://sandbox.przelewy24.pl"
            : "https://secure.przelewy24.pl";

        // Native PocketBase SHA384 signature (No external CryptoJS eval needed!)
        const signString = `{"sessionId":"${orderId}","merchantId":${P24_MERCHANT_ID},"amount":${amount},"currency":"PLN","crc":"${P24_CRC}"}`;
        const sign = $security.sha384(signString);

        const payload = {
            merchantId: P24_MERCHANT_ID,
            posId: P24_POS_ID,
            sessionId: orderId,
            amount: amount,
            currency: "PLN",
            description: "DemoShop Order #" + orderId,
            email: email,
            country: "PL",
            language: "en",
            urlReturn: `${STORE_URL}/cart/success`,
            urlStatus: `${BACKEND_URL}/api/p24/webhook`,
            sign: sign,
        };

        // Base64 encode Basic Auth credentials
        const libRes = $http.send({
            url: "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js",
            method: "GET",
        });
        eval(libRes.raw);
        const rawAuth = CryptoJS.enc.Utf8.parse(P24_POS_ID + ":" + P24_API_KEY);
        const basicAuth = CryptoJS.enc.Base64.stringify(rawAuth);

        const res = $http.send({
            url: `${P24_BASE_URL}/api/v1/transaction/register`,
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + basicAuth,
            },
        });

        if (res.statusCode === 200) {
            const responseData = JSON.parse(res.raw);
            return e.json(200, {
                status: "success",
                url: `${P24_BASE_URL}/trnRequest/` + responseData.data.token,
            });
        } else {
            return e.json(400, {
                status: "P24_REJECTED",
                error: "Payment gateway rejected the transaction request",
                details: res.raw,
            });
        }
    } catch (err) {
        return e.json(400, {
            status: "CRITICAL_ERROR",
            message: err.message,
        });
    }
});

// =================================================================
// 2. ENDPOINT: WEBHOOK (Called asynchronously by Przelewy24)
// =================================================================
routerAdd("POST", "/api/p24/webhook", (e) => {
    try {
        const info = e.requestInfo();
        const data = info.body;

        if (!data || !data.sessionId || !data.orderId) {
            return e.json(400, { status: "error", message: "Missing webhook payload parameters" });
        }

        const P24_MERCHANT_ID = Number($os.getenv("P24_MERCHANT_ID") || 100000);
        const P24_POS_ID = Number($os.getenv("P24_POS_ID") || P24_MERCHANT_ID);
        const P24_CRC = $os.getenv("P24_CRC") || "your_p24_crc_key_here";
        const P24_API_KEY = $os.getenv("P24_API_KEY") || "your_p24_api_key_here";
        const IS_SANDBOX = $os.getenv("P24_IS_SANDBOX") === "true";
        const P24_BASE_URL = IS_SANDBOX
            ? "https://sandbox.przelewy24.pl"
            : "https://secure.przelewy24.pl";

        const orderRecord = $app.findRecordById("orders", data.sessionId);

        if (!orderRecord) {
            console.log("[Webhook] Order not found: " + data.sessionId);
            return e.json(404, { status: "error", message: "Order not found" });
        }

        const verifySignString = `{"sessionId":"${data.sessionId}","orderId":${data.orderId},"amount":${data.amount},"currency":"${data.currency}","crc":"${P24_CRC}"}`;
        const verifySign = $security.sha384(verifySignString);

        const verifyPayload = {
            merchantId: P24_MERCHANT_ID,
            posId: P24_POS_ID,
            sessionId: data.sessionId,
            amount: data.amount,
            currency: data.currency,
            orderId: data.orderId,
            sign: verifySign,
        };

        const libRes = $http.send({
            url: "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js",
            method: "GET",
        });
        eval(libRes.raw);
        const rawAuth = CryptoJS.enc.Utf8.parse(P24_POS_ID + ":" + P24_API_KEY);
        const basicAuth = CryptoJS.enc.Base64.stringify(rawAuth);

        const verifyRes = $http.send({
            url: `${P24_BASE_URL}/api/v1/transaction/verify`,
            method: "PUT",
            body: JSON.stringify(verifyPayload),
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + basicAuth,
            },
        });

        if (verifyRes.statusCode === 200) {
            // Set status to "paid" (SuccessPage.tsx and OrdersPanel.tsx support both "paid" and "opłacone")
            orderRecord.set("status", "paid");
            $app.save(orderRecord);

            console.log(`[Webhook] SUCCESS! Order ${data.sessionId} marked as paid.`);
            return e.json(200, { status: "OK" });
        } else {
            console.log("[Webhook] P24 verification failed:", verifyRes.raw);
            return e.json(400, { status: "error", message: "Verification failed" });
        }
    } catch (err) {
        console.log("[Webhook] Critical error:", err.message);
        return e.json(500, { status: "error", message: err.message });
    }
});