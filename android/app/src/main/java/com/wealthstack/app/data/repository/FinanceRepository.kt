package com.wealthstack.app.data.repository

import com.wealthstack.app.data.api.AccountDto
import com.wealthstack.app.data.api.CreateAccountRequest
import com.wealthstack.app.data.api.CreateTransactionRequest
import com.wealthstack.app.data.api.DashboardSummaryDto
import com.wealthstack.app.data.api.TransactionDto
import com.wealthstack.app.data.api.WealthStackApi
import com.wealthstack.app.data.api.requireData
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FinanceRepository @Inject constructor(
    private val api: WealthStackApi,
) {
    suspend fun dashboardSummary(): DashboardSummaryDto =
        api.dashboardSummary().requireData()

    suspend fun listAccounts(): List<AccountDto> =
        api.listAccounts().requireData()

    suspend fun createAccount(name: String, currency: String = "USD", accountType: String = "cash"): AccountDto =
        api.createAccount(CreateAccountRequest(name, currency, accountType)).requireData()

    suspend fun listTransactions(): List<TransactionDto> =
        api.listTransactions().requireData()

    suspend fun createTransaction(
        accountId: String,
        amount: String,
        transactionType: String,
        note: String? = null,
    ): TransactionDto =
        api.createTransaction(
            CreateTransactionRequest(
                accountId = accountId,
                amount = amount,
                transactionType = transactionType,
                note = note,
            ),
        ).requireData()
}
