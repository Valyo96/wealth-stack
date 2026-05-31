package com.wealthstack.app.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wealthstack.app.data.api.DashboardSummaryDto
import com.wealthstack.app.data.repository.FinanceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val isLoading: Boolean = true,
    val summary: DashboardSummaryDto? = null,
    val error: String? = null,
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val financeRepository: FinanceRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val summary = financeRepository.dashboardSummary()
                _uiState.update { it.copy(isLoading = false, summary = summary) }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = e.message ?: "Failed to load dashboard")
                }
            }
        }
    }

    fun ensureDefaultAccount() {
        viewModelScope.launch {
            try {
                val accounts = financeRepository.listAccounts()
                if (accounts.isEmpty()) {
                    financeRepository.createAccount("Main Wallet")
                }
            } catch (_: Exception) {
            }
        }
    }
}
