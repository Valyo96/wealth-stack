package com.wealthstack.app.ui.auth

import com.wealthstack.app.data.repository.AuthRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private lateinit var authRepository: AuthRepository
    private lateinit var viewModel: LoginViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(dispatcher)
        authRepository = mockk(relaxed = true)
        every { authRepository.isLoggedIn } returns flowOf(false)
        viewModel = LoginViewModel(authRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun submit_showsValidationError_whenPasswordTooShort() = runTest(dispatcher) {
        viewModel.onEmailChange(TEST_EMAIL)
        viewModel.onPasswordChange("short")

        var successCalled = false
        viewModel.submit { successCalled = true }
        advanceUntilIdle()

        assertEquals("Email required; password min 8 characters", viewModel.uiState.value.error)
        assertFalse(viewModel.uiState.value.isLoading)
        assertFalse(successCalled)
        coVerify(exactly = 0) { authRepository.login(any(), any()) }
        coVerify(exactly = 0) { authRepository.register(any(), any()) }
    }

    @Test
    fun submit_callsLogin_whenRegisterModeDisabled() = runTest(dispatcher) {
        coEvery { authRepository.login(any(), any()) } returns Unit

        viewModel.onEmailChange(TEST_EMAIL)
        viewModel.onPasswordChange(TEST_PASSWORD)

        var successCalled = false
        viewModel.submit { successCalled = true }
        advanceUntilIdle()

        assertTrue(successCalled)
        assertEquals(null, viewModel.uiState.value.error)
        assertFalse(viewModel.uiState.value.isLoading)
        coVerify(exactly = 1) { authRepository.login(TEST_EMAIL, TEST_PASSWORD) }
    }

    @Test
    fun submit_callsRegister_whenRegisterModeEnabled() = runTest(dispatcher) {
        coEvery { authRepository.register(any(), any()) } returns Unit

        viewModel.toggleMode()
        viewModel.onEmailChange(TEST_EMAIL)
        viewModel.onPasswordChange(TEST_PASSWORD)

        viewModel.submit {}
        advanceUntilIdle()

        coVerify(exactly = 1) { authRepository.register(TEST_EMAIL, TEST_PASSWORD) }
        coVerify(exactly = 0) { authRepository.login(any(), any()) }
    }

    @Test
    fun submit_surfacesRepositoryError() = runTest(dispatcher) {
        coEvery { authRepository.login(any(), any()) } throws IllegalStateException("Network down")

        viewModel.onEmailChange(TEST_EMAIL)
        viewModel.onPasswordChange(TEST_PASSWORD)
        viewModel.submit {}
        advanceUntilIdle()

        assertEquals("Network down", viewModel.uiState.value.error)
        assertFalse(viewModel.uiState.value.isLoading)
    }

    private companion object {
        const val TEST_EMAIL = "user@example.com"
        const val TEST_PASSWORD = "password123"
    }
}
