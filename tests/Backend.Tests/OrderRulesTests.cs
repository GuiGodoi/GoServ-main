using Backend.Models;
using Backend.Services;

namespace Backend.Tests;

public class OrderRulesTests
{
    [Fact]
    public void CalculateLineTotal_SumsUnitPriceAndAddonsTimesQuantity()
    {
        var total = OrderRules.CalculateLineTotal(
            unitPrice: 28.90m,
            quantity: 2,
            addonUnitPrices: [4.00m, 5.50m]);

        // (28.90 + 4 + 5.50) * 2 = 76.80
        Assert.Equal(76.80m, total);
    }

    [Fact]
    public void CalculateLineTotal_IgnoresZeroPriceAddon()
    {
        var total = OrderRules.CalculateLineTotal(20m, 1, [0m]);
        Assert.Equal(20m, total);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void CalculateLineTotal_RejectsInvalidQuantity(int quantity)
    {
        Assert.Throws<ArgumentException>(() =>
            OrderRules.CalculateLineTotal(10m, quantity, []));
    }

    [Fact]
    public void CalculateOrderTotal_SumsLineTotals()
    {
        var total = OrderRules.CalculateOrderTotal([10.50m, 20.00m, 5.25m]);
        Assert.Equal(35.75m, total);
    }

    [Theory]
    [InlineData(OrderStatuses.AwaitingPayment, OrderStatuses.Received, true)]
    [InlineData(OrderStatuses.AwaitingPayment, OrderStatuses.Preparing, false)]
    [InlineData(OrderStatuses.Received, OrderStatuses.Preparing, true)]
    [InlineData(OrderStatuses.Preparing, OrderStatuses.Ready, true)]
    [InlineData(OrderStatuses.Ready, OrderStatuses.Delivered, true)]
    [InlineData(OrderStatuses.Received, OrderStatuses.Ready, false)]
    [InlineData(OrderStatuses.Delivered, OrderStatuses.Preparing, false)]
    [InlineData(OrderStatuses.Cancelled, OrderStatuses.Received, false)]
    public void CanTransition_EnforcesKitchenWorkflow(string from, string to, bool expected)
    {
        Assert.Equal(expected, OrderRules.CanTransition(from, to));
    }

    [Fact]
    public void EnsureCanTransition_ThrowsOnInvalidJump()
    {
        Assert.Throws<InvalidOperationException>(() =>
            OrderRules.EnsureCanTransition(OrderStatuses.Received, OrderStatuses.Delivered));
    }
}
