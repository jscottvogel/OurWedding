$PROFILE_NAME = "AdministratorAccess-520477993393"
$REGIONS = @("us-east-1","us-east-2","us-west-1","us-west-2","eu-west-1","eu-west-2","eu-central-1","ap-southeast-1","ap-southeast-2","ap-northeast-1","ap-northeast-2","sa-east-1","ca-central-1")

Write-Host "================================================"
Write-Host " AWS Resource Scanner"
Write-Host " Profile: $PROFILE_NAME"
Write-Host "================================================"

foreach ($region in $REGIONS) {
    Write-Host ""
    Write-Host "######## REGION: $region ########"

    # OpenSearch
    $result = aws opensearch list-domain-names --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.DomainNames.Count -gt 0) {
        Write-Host "  [OPENSEARCH] $($result.DomainNames.Count) domain(s): $($result.DomainNames.DomainName -join ', ')"
    }

    # ElastiCache
    $result = aws elasticache describe-cache-clusters --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.CacheClusters.Count -gt 0) {
        Write-Host "  [ELASTICACHE] $($result.CacheClusters.Count) cluster(s): $($result.CacheClusters.CacheClusterId -join ', ')"
    }

    # RDS
    $result = aws rds describe-db-instances --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.DBInstances.Count -gt 0) {
        Write-Host "  [RDS] $($result.DBInstances.Count) instance(s): $($result.DBInstances.DBInstanceIdentifier -join ', ')"
    }

    # EC2
    $result = aws ec2 describe-instances --region $region --profile $PROFILE_NAME --filters "Name=instance-state-name,Values=running,stopped" 2>$null | ConvertFrom-Json
    $count = ($result.Reservations | ForEach-Object { $_.Instances } | Measure-Object).Count
    if ($count -gt 0) {
        Write-Host "  [EC2] $count instance(s)"
    }

    # EKS
    $result = aws eks list-clusters --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.clusters.Count -gt 0) {
        Write-Host "  [EKS] $($result.clusters.Count) cluster(s): $($result.clusters -join ', ')"
    }

    # Load Balancers
    $result = aws elbv2 describe-load-balancers --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.LoadBalancers.Count -gt 0) {
        Write-Host "  [ELB] $($result.LoadBalancers.Count) load balancer(s): $($result.LoadBalancers.LoadBalancerName -join ', ')"
    }

    # NAT Gateways
    $result = aws ec2 describe-nat-gateways --region $region --profile $PROFILE_NAME --filter "Name=state,Values=available" 2>$null | ConvertFrom-Json
    if ($result.NatGateways.Count -gt 0) {
        Write-Host "  [NAT GATEWAY] $($result.NatGateways.Count) gateway(s)"
    }

    # DynamoDB
    $result = aws dynamodb list-tables --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.TableNames.Count -gt 0) {
        Write-Host "  [DYNAMODB] $($result.TableNames.Count) table(s): $($result.TableNames -join ', ')"
    }

    # Lambda
    $result = aws lambda list-functions --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.Functions.Count -gt 0) {
        Write-Host "  [LAMBDA] $($result.Functions.Count) function(s)"
    }

    # ECS
    $result = aws ecs list-clusters --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.clusterArns.Count -gt 0) {
        Write-Host "  [ECS] $($result.clusterArns.Count) cluster(s)"
    }

    # Redshift
    $result = aws redshift describe-clusters --region $region --profile $PROFILE_NAME 2>$null | ConvertFrom-Json
    if ($result.Clusters.Count -gt 0) {
        Write-Host "  [REDSHIFT] $($result.Clusters.Count) cluster(s): $($result.Clusters.ClusterIdentifier -join ', ')"
    }
}

Write-Host ""
Write-Host "================================================"
Write-Host " Scan Complete"
Write-Host "================================================"