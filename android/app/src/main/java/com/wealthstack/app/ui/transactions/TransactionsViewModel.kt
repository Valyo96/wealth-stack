package com.wealthstack.app.ui.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wealthstack.app.data.api.AccountDto
import com.wealthstack.app.data.api.TransactionDto
import com.wealthstack.app.data.repository.FinanceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TransactionsUiState(
    val isLoading: Boolean = true,
    val transactions: List<TransactionDto> = emptyList(),
    val accounts: List<AccountDto> = emptyList(),
    val showAddDialog: Boolean = false,
    val amount: String = "",
    val transactionType: String = "expense",
    val error: String? = null,
)

@HiltViewModel
class TransactionsViewModel @Inject constructor(
    private val financeRepository: FinanceRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(TransactionsUiState())
    val uiState: StateFlow<TransactionsUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val accounts = financeRepository.listAccounts()
                val txs = financeRepository.listTransactions()
                _uiState.update {
                    it.copy(isLoading = false, accounts = accounts, transactions = txs)
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Failed to load transactions")
                }
            }
        }
    }

    fun openAddDialog() {
        _uiState.update { it.copy(showAddDialog = true, amount = "", error = null) }
    }

    fun closeAddDialog() {
        _uiState.update { it.copy(showAddDialog = false) }
    }

    fun onAmountChange(value: String) {
        _uiState.update { it.copy(amount = value) }
    }

    fun onTypeChange(value: String) {
        _uiState.update { it.copy(transactionType = value) }
    }

    fun submitTransaction() {
        val state = _uiState.value
        val accountId = state.accounts.firstOrNull()?.id
        if (accountId == null) {
            _uiState.update { it.copy(error = "Create an account on the dashboard first") }
            return
        }
        val amount = state.amount.trim()
        if (amount.isBlank()) {
            _uiState.update { it.copy(error = "Amount is required") }
            return
        }
        viewModelScope.launch {
            try {
                financeRepository.createTransaction(
                    accountId = accountId,
                    amount = amount,
                    transactionType = state.transactionType,
                )
                closeAddDialog()
                refresh()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Failed to create transaction") }
            }
        }
    }
}
