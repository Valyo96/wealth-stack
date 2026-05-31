package com.wealthstack.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore("auth_tokens")

@Singleton
class TokenStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val accessKey = stringPreferencesKey("access_token")
    private val refreshKey = stringPreferencesKey("refresh_token")

    val accessToken: Flow<String?> = context.dataStore.data.map { it[accessKey] }

    suspend fun saveTokens(access: String, refresh: String) {
        context.dataStore.edit {
            it[accessKey] = access
            it[refreshKey] = refresh
        }
    }

    suspend fun getAccessToken(): String? = context.dataStore.data.first()[accessKey]

    suspend fun getRefreshToken(): String? = context.dataStore.data.first()[refreshKey]

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
