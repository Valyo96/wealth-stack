package com.wealthstack.app.data.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface WealthStackApi {
    @POST("v1/auth/register")
    suspend fun register(@Body body: RegisterRequest): ApiEnvelope<TokenPair>

    @POST("v1/auth/login")
    suspend fun login(@Body body: LoginRequest): ApiEnvelope<TokenPair>

    @GET("v1/accounts")
    suspend fun listAccounts(): ApiEnvelope<List<AccountDto>>

    @POST("v1/accounts")
    suspend fun createAccount(@Body body: CreateAccountRequest): ApiEnvelope<AccountDto>

    @GET("v1/transactions")
    suspend fun listTransactions(): ApiEnvelope<List<TransactionDto>>

    @POST("v1/transactions")
    suspend fun createTransaction(@Body body: CreateTransactionRequest): ApiEnvelope<TransactionDto>

    @GET("v1/dashboard/summary")
    suspend fun dashboardSummary(): ApiEnvelope<DashboardSummaryDto>
}
