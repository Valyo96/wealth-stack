package com.wealthstack.app.ui.transactions

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionsScreen(
    onBack: () -> Unit,
    viewModel: TransactionsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    if (state.showAddDialog) {
        AlertDialog(
            onDismissRequest = viewModel::closeAddDialog,
            title = { Text("Add transaction") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = state.amount,
                        onValueChange = viewModel::onAmountChange,
                        label = { Text("Amount") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                    RowChoice("Income", state.transactionType == "income") {
                        viewModel.onTypeChange("income")
                    }
                    RowChoice("Expense", state.transactionType == "expense") {
                        viewModel.onTypeChange("expense")
                    }
                    state.error?.let {
                        Text(it, color = MaterialTheme.colorScheme.error)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = viewModel::submitTransaction) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = viewModel::closeAddDialog) {
                    Text("Cancel")
                }
            },
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Transactions") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = viewModel::openAddDialog) {
                Icon(Icons.Default.Add, contentDescription = "Add")
            }
        },
    ) { padding ->
        when {
            state.isLoading -> CircularProgressIndicator(Modifier.padding(padding).padding(16.dp))
            state.error != null && state.transactions.isEmpty() -> {
                Text(
                    state.error!!,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(padding).padding(16.dp),
                )
            }
            state.transactions.isEmpty() -> {
                Text(
                    "No transactions yet. Tap + to add one.",
                    modifier = Modifier.padding(padding).padding(16.dp),
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(state.transactions, key = { it.id }) { tx ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    "${tx.transactionType.replaceFirstChar { it.uppercase() }} · ${tx.amount}",
                                    style = MaterialTheme.typography.titleMedium,
                                )
                                Text(tx.occurredAt, style = MaterialTheme.typography.bodySmall)
                                tx.note?.let { Text(it) }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RowChoice(label: String, selected: Boolean, onSelect: () -> Unit) {
    TextButton(onClick = onSelect) {
        RadioButton(selected = selected, onClick = onSelect)
        Text(label)
    }
}
