package com.wealthstack.app.data.api

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ApiEnvelope<T>(
    @Json(name = "data") val data: T? = null,
    @Json(name = "error") val error: ApiError? = null,
)

@JsonClass(generateAdapter = true)
data class ApiError(
    @Json(name = "code") val code: String,
    @Json(name = "message") val message: String,
)

@JsonClass(generateAdapter = true)
data class TokenPair(
    @Json(name = "access_token") val accessToken: String,
    @Json(name = "refresh_token") val refreshToken: String,
    @Json(name = "expires_in") val expiresIn: Long,
)

@JsonClass(generateAdapter = true)
data class RegisterRequest(
    @Json(name = "email") val email: String,
    @Json(name = "password") val password: String,
)

@JsonClass(generateAdapter = true)
data class LoginRequest(
    @Json(name = "email") val email: String,
    @Json(name = "password") val password: String,
)

@JsonClass(generateAdapter = true)
data class AccountDto(
    @Json(name = "id") val id: String,
    @Json(name = "name") val name: String,
    @Json(name = "currency") val currency: String,
    @Json(name = "account_type") val accountType: String,
)

@JsonClass(generateAdapter = true)
data class CreateAccountRequest(
    @Json(name = "name") val name: String,
    @Json(name = "currency") val currency: String = "USD",
    @Json(name = "account_type") val accountType: String = "cash",
)

@JsonClass(generateAdapter = true)
data class TransactionDto(
    @Json(name = "id") val id: String,
    @Json(name = "account_id") val accountId: String,
    @Json(name = "amount") val amount: String,
    @Json(name = "transaction_type") val transactionType: String,
    @Json(name = "occurred_at") val occurredAt: String,
    @Json(name = "note") val note: String? = null,
)

@JsonClass(generateAdapter = true)
data class CreateTransactionRequest(
    @Json(name = "account_id") val accountId: String,
    @Json(name = "amount") val amount: String,
    @Json(name = "transaction_type") val transactionType: String,
    @Json(name = "occurred_at") val occurredAt: String? = null,
    @Json(name = "note") val note: String? = null,
)

@JsonClass(generateAdapter = true)
data class DashboardSummaryDto(
    @Json(name = "total_income") val totalIncome: String,
    @Json(name = "total_expenses") val totalExpenses: String,
    @Json(name = "net") val net: String,
    @Json(name = "period_label") val periodLabel: String,
)
