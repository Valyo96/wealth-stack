import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { Card } from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(
      <Card>
        <Text>Inside</Text>
      </Card>,
    );
    expect(screen.getByText("Inside")).toBeTruthy();
  });
});
