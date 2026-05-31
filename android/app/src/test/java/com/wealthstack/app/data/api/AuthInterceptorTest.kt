package com.wealthstack.app.data.api

import com.wealthstack.app.data.local.TokenStore
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class AuthInterceptorTest {

    private lateinit var server: MockWebServer
    private lateinit var tokenStore: TokenStore

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        tokenStore = mockk()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun addsBearerToken_forProtectedPaths() = runBlocking {
        coEvery { tokenStore.getAccessToken() } returns "access-token-123"
        server.enqueue(MockResponse().setResponseCode(200).setBody("{}"))

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStore))
            .build()

        client.newCall(
            Request.Builder()
                .url(server.url("/v1/accounts"))
                .build(),
        ).execute().close()

        val recorded = server.takeRequest()
        assertEquals("Bearer access-token-123", recorded.getHeader("Authorization"))
    }

    @Test
    fun skipsAuthorizationHeader_forAuthPaths() = runBlocking {
        coEvery { tokenStore.getAccessToken() } returns "access-token-123"
        server.enqueue(MockResponse().setResponseCode(200).setBody("{}"))

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStore))
            .build()

        client.newCall(
            Request.Builder()
                .url(server.url("/v1/auth/login"))
                .build(),
        ).execute().close()

        val recorded = server.takeRequest()
        assertNull(recorded.getHeader("Authorization"))
    }

    @Test
    fun proceedsWithoutAuthorization_whenTokenMissing() = runBlocking {
        coEvery { tokenStore.getAccessToken() } returns null
        server.enqueue(MockResponse().setResponseCode(200).setBody("{}"))

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStore))
            .build()

        client.newCall(
            Request.Builder()
                .url(server.url("/v1/transactions"))
                .build(),
        ).execute().close()

        val recorded = server.takeRequest()
        assertNull(recorded.getHeader("Authorization"))
    }
}
