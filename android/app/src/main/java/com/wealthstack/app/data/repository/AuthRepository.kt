package com.wealthstack.app.data.repository

import com.wealthstack.app.data.api.LoginRequest
import com.wealthstack.app.data.api.RegisterRequest
import com.wealthstack.app.data.api.WealthStackApi
import com.wealthstack.app.data.api.requireData
import com.wealthstack.app.data.local.TokenStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: WealthStackApi,
    private val tokenStore: TokenStore,
) {
    val isLoggedIn: Flow<Boolean> = tokenStore.accessToken.map { !it.isNullOrBlank() }

    suspend fun register(email: String, password: String) {
        val tokens = api.register(RegisterRequest(email, password)).requireData()
        tokenStore.saveTokens(tokens.accessToken, tokens.refreshToken)
    }

    suspend fun login(email: String, password: String) {
        val tokens = api.login(LoginRequest(email, password)).requireData()
        tokenStore.saveTokens(tokens.accessToken, tokens.refreshToken)
    }

    suspend fun logout() {
        tokenStore.clear()
    }
}
