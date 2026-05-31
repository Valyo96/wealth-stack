package com.wealthstack.app.data.api

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class ApiExtensionsTest {

    @Test
    fun requireData_returnsPayload_whenDataPresent() {
        val envelope = ApiEnvelope(data = "ok", error = null)

        assertEquals("ok", envelope.requireData())
    }

    @Test
    fun requireData_throwsApiException_whenErrorPresent() {
        val envelope = ApiEnvelope<String>(
            data = null,
            error = ApiError(code = "invalid_credentials", message = "Bad login"),
        )

        val error = assertThrows(ApiException::class.java) {
            envelope.requireData()
        }

        assertEquals("invalid_credentials", error.code)
        assertEquals("Bad login", error.message)
    }

    @Test
    fun requireData_throwsApiException_whenDataMissing() {
        val envelope = ApiEnvelope<String>(data = null, error = null)

        val error = assertThrows(ApiException::class.java) {
            envelope.requireData()
        }

        assertEquals("empty_response", error.code)
    }
}
