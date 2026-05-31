package com.wealthstack.app.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onAuthenticated: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Wealth Stack",
            style = MaterialTheme.typography.headlineMedium,
        )
        Text(
            text = if (state.isRegisterMode) "Create your account" else "Sign in",
            modifier = Modifier.padding(top = 8.dp, bottom = 24.dp),
            style = MaterialTheme.typography.bodyLarge,
        )
        OutlinedTextField(
            value = state.email,
            onValueChange = viewModel::onEmailChange,
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
        )
        OutlinedTextField(
            value = state.password,
            onValueChange = viewModel::onPasswordChange,
            label = { Text("Password") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 12.dp),
            singleLine = true,
        )
        state.error?.let {
            Text(
                text = it,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 12.dp),
            )
        }
        Button(
            onClick = { viewModel.submit(onAuthenticated) },
            enabled = !state.isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp),
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(modifier = Modifier.padding(4.dp))
            } else {
                Text(if (state.isRegisterMode) "Register" else "Login")
            }
        }
        TextButton(onClick = viewModel::toggleMode) {
            Text(
                if (state.isRegisterMode) "Already have an account? Sign in"
                else "New here? Create account",
            )
        }
    }
}
