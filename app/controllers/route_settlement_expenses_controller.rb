class RouteSettlementExpensesController < ApplicationController
  before_action :require_route_access!
  before_action :set_settlement

  def create
    if @settlement.completed?
      redirect_to route_settlement_path(@settlement), alert: "No se pueden añadir gastos a una rendición completada."
      return
    end

    expense = @settlement.route_settlement_expenses.new(expense_params)

    if expense.save
      redirect_to route_settlement_path(@settlement)
    else
      redirect_to route_settlement_path(@settlement), alert: "Error: #{expense.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    expense = @settlement.route_settlement_expenses.find(params[:id])

    unless @settlement.completed?
      expense.destroy
    end

    redirect_to route_settlement_path(@settlement)
  end

  private

  def set_settlement
    @settlement = RouteSettlement.find(params[:route_settlement_id])
  end

  def expense_params
    params.require(:route_settlement_expense).permit(:description, :amount, :payment_method)
  end
end
