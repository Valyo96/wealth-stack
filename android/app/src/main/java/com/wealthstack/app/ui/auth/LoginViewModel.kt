package com.wealthstack.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wealthstack.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isRegisterMode: Boolean = false,
    val isLoading: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    val isLoggedIn = authRepository.isLoggedIn.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5_000),
        false,
    )

    fun onEmailChange(value: String) {
        _uiState.update { it.copy(email = value, error = null) }
    }

    fun onPasswordChange(value: String) {
        _uiState.update { it.copy(password = value, error = null) }
    }

    fun toggleMode() {
        _uiState.update { it.copy(isRegisterMode = !it.isRegisterMode, error = null) }
    }

    fun submit(onSuccess: () -> Unit) {
        val state = _uiState.value
        val email = state.email.trim()
        val password = state.password
        if (email.isBlank() || password.length < 8) {
            _uiState.update { it.copy(error = "Email required; password min 8 characters") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                if (state.isRegisterMode) {
                    authRepository.register(email, password)
                } else {
                    authRepository.login(email, password)
                }
                _uiState.update { it.copy(isLoading = false) }
                onSuccess()
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Authentication failed",
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}
