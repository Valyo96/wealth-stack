package com.wealthstack.app.data.api

fun <T> ApiEnvelope<T>.requireData(): T {
    if (error != null) {
        throw ApiException(error.code, error.message)
    }
    return data ?: throw ApiException("empty_response", "Empty response from server")
}

class ApiException(val code: String, override val message: String) : Exception(message)
