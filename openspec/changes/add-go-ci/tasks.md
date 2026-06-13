## 1. Configuration

- [ ] 1.1 Create the GitHub Actions workflow file `.github/workflows/go-ci.yml`
- [ ] 1.2 Add triggers for `push` and `pull_request` on the `main` branch
- [ ] 1.3 Setup job with `ubuntu-latest` and define permissions

## 2. CI Steps Implementation

- [ ] 2.1 Add `actions/checkout@v6` step
- [ ] 2.2 Add `actions/setup-go@v5` specifying Go version `1.23`
- [ ] 2.3 Add step: `cd go && go build ./...`
- [ ] 2.4 Add step: `cd go && go test -coverprofile=coverage.out ./...`
- [ ] 2.5 Add step: `cd go && go vet ./...`

## 3. External Services Integration

- [ ] 3.1 Add Codecov upload step using `codecov/codecov-action@v6`
- [ ] 3.2 Add SonarQube scan step using `SonarSource/sonarqube-scan-action@v8`
