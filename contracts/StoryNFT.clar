(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TOKEN-ID u101)
(define-constant ERR-INVALID-METADATA u102)
(define-constant ERR-INVALID-ROYALTY-RATE u103)
(define-constant ERR-INVALID-RECOVERY-MILESTONE u104)
(define-constant ERR-TOKEN-ALREADY-EXISTS u105)
(define-constant ERR-TOKEN-NOT-FOUND u106)
(define-constant ERR-INVALID-TIMESTAMP u107)
(define-constant ERR-INVALID-OWNER u108)
(define-constant ERR-INVALID-STORY-HASH u109)
(define-constant ERR-INVALID-ART-URI u110)
(define-constant ERR-INVALID-RECOVERY-GOAL u111)
(define-constant ERR-MAX-TOKENS-EXCEEDED u112)
(define-constant ERR-INVALID-UPDATE-PARAM u113)
(define-constant ERR-ROYALTY-NOT-SET u114)
(define-constant ERR-INVALID-MILESTONE-COUNT u115)
(define-constant ERR-INVALID-STATUS u116)
(define-constant ERR-INVALID-CURRENCY u117)
(define-constant ERR-INVALID-LOCATION u118)
(define-constant ERR-INVALID-GROUP-ID u119)
(define-constant ERR-INVALID-VERIFIER u120)

(define-data-var next-token-id uint u0)
(define-data-var max-tokens uint u10000)
(define-data-var mint-fee uint u500)
(define-data-var royalty-rate uint u10)
(define-data-var verifier-contract (optional principal) none)

(define-map tokens
  uint
  {
    owner: principal,
    story-hash: (buff 32),
    art-uri: (string-ascii 256),
    metadata: (string-utf8 512),
    recovery-goal: (string-utf8 256),
    milestone-count: uint,
    timestamp: uint,
    status: bool,
    currency: (string-ascii 10),
    location: (string-utf8 100),
    group-id: (optional uint)
  }
)

(define-map token-royalties
  uint
  {
    rate: uint,
    beneficiary: principal
  }
)

(define-map token-milestones
  { token-id: uint, milestone-index: uint }
  {
    description: (string-utf8 256),
    achieved: bool,
    timestamp: uint
  }
)

(define-map tokens-by-owner
  principal
  (list 100 uint)
)

(define-read-only (get-token (id uint))
  (map-get? tokens id)
)

(define-read-only (get-token-royalty (id uint))
  (map-get? token-royalties id)
)

(define-read-only (get-token-milestone (id uint) (index uint))
  (map-get? token-milestones { token-id: id, milestone-index: index })
)

(define-read-only (get-tokens-of (owner principal))
  (default-to (list) (map-get? tokens-by-owner owner))
)

(define-private (validate-story-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-STORY-HASH))
)

(define-private (validate-art-uri (uri (string-ascii 256)))
  (if (and (> (len uri) u0) (<= (len uri) u256))
      (ok true)
      (err ERR-INVALID-ART-URI))
)

(define-private (validate-metadata (meta (string-utf8 512)))
  (if (<= (len meta) u512)
      (ok true)
      (err ERR-INVALID-METADATA))
)

(define-private (validate-recovery-goal (goal (string-utf8 256)))
  (if (<= (len goal) u256)
      (ok true)
      (err ERR-INVALID-RECOVERY-GOAL))
)

(define-private (validate-milestone-count (count uint))
  (if (and (> count u0) (<= count u10))
      (ok true)
      (err ERR-INVALID-MILESTONE-COUNT))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-TIMESTAMP))
)

(define-private (validate-royalty-rate (rate uint))
  (if (<= rate u20)
      (ok true)
      (err ERR-INVALID-ROYALTY-RATE))
)

(define-private (validate-status (status bool))
  (ok true)
)

(define-private (validate-currency (cur (string-ascii 10)))
  (if (or (is-eq cur "STX") (is-eq cur "BTC") (is-eq cur "USD"))
      (ok true)
      (err ERR-INVALID-CURRENCY))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (<= (len loc) u100)
      (ok true)
      (err ERR-INVALID-LOCATION))
)

(define-private (validate-group-id (gid (optional uint)))
  (ok true)
)

(define-private (validate-owner (owner principal))
  (if (not (is-eq owner tx-sender))
      (ok true)
      (err ERR-INVALID-OWNER))
)

(define-public (set-verifier-contract (contract-principal principal))
  (begin
    (asserts! (is-none (var-get verifier-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set verifier-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-tokens (new-max uint))
  (begin
    (asserts! (is-some (var-get verifier-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set max-tokens new-max)
    (ok true)
  )
)

(define-public (set-mint-fee (new-fee uint))
  (begin
    (asserts! (is-some (var-get verifier-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set mint-fee new-fee)
    (ok true)
  )
)

(define-public (set-royalty-rate (new-rate uint))
  (begin
    (try! (validate-royalty-rate new-rate))
    (asserts! (is-some (var-get verifier-contract)) (err ERR-NOT-AUTHORIZED))
    (var-set royalty-rate new-rate)
    (ok true)
  )
)

(define-public (mint-token
  (story-hash (buff 32))
  (art-uri (string-ascii 256))
  (metadata (string-utf8 512))
  (recovery-goal (string-utf8 256))
  (milestone-count uint)
  (currency (string-ascii 10))
  (location (string-utf8 100))
  (group-id (optional uint))
)
  (let (
    (next-id (var-get next-token-id))
    (verifier (var-get verifier-contract))
  )
    (asserts! (< next-id (var-get max-tokens)) (err ERR-MAX-TOKENS-EXCEEDED))
    (try! (validate-story-hash story-hash))
    (try! (validate-art-uri art-uri))
    (try! (validate-metadata metadata))
    (try! (validate-recovery-goal recovery-goal))
    (try! (validate-milestone-count milestone-count))
    (try! (validate-currency currency))
    (try! (validate-location location))
    (try! (validate-group-id group-id))
    (asserts! (is-none (map-get? tokens next-id)) (err ERR-TOKEN-ALREADY-EXISTS))
    (let ((verifier-recipient (unwrap! verifier (err ERR-NOT-AUTHORIZED))))
      (try! (stx-transfer? (var-get mint-fee) tx-sender verifier-recipient))
    )
    (map-set tokens next-id
      {
        owner: tx-sender,
        story-hash: story-hash,
        art-uri: art-uri,
        metadata: metadata,
        recovery-goal: recovery-goal,
        milestone-count: milestone-count,
        timestamp: block-height,
        status: true,
        currency: currency,
        location: location,
        group-id: group-id
      }
    )
    (map-set token-royalties next-id
      {
        rate: (var-get royalty-rate),
        beneficiary: tx-sender
      }
    )
    (let ((current-tokens (get-tokens-of tx-sender)))
      (map-set tokens-by-owner tx-sender (unwrap! (as-max-len? (append current-tokens next-id) u100) (err ERR-INVALID-UPDATE-PARAM)))
    )
    (var-set next-token-id (+ next-id u1))
    (print { event: "token-minted", id: next-id })
    (ok next-id)
  )
)

(define-public (update-token-metadata
  (token-id uint)
  (new-metadata (string-utf8 512))
  (new-art-uri (string-ascii 256))
)
  (let ((token (map-get? tokens token-id)))
    (match token
      t
        (begin
          (asserts! (is-eq (get owner t) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-metadata new-metadata))
          (try! (validate-art-uri new-art-uri))
          (map-set tokens token-id
            (merge t {
              metadata: new-metadata,
              art-uri: new-art-uri,
              timestamp: block-height
            })
          )
          (print { event: "token-updated", id: token-id })
          (ok true)
        )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (transfer-token (token-id uint) (new-owner principal))
  (let ((token (map-get? tokens token-id)))
    (match token
      t
        (begin
          (asserts! (is-eq (get owner t) tx-sender) (err ERR-NOT-AUTHORIZED))
          (try! (validate-owner new-owner))
          (let ((royalty (unwrap! (map-get? token-royalties token-id) (err ERR-ROYALTY-NOT-SET))))
            (let ((royalty-amount (/ (* (var-get mint-fee) (get rate royalty)) u100)))
              (try! (stx-transfer? royalty-amount new-owner (get beneficiary royalty)))
            )
          )
          (map-set tokens token-id
            (merge t { owner: new-owner })
          )
          (let ((sender-tokens (filter (lambda (id) (not (is-eq id token-id))) (get-tokens-of tx-sender))))
            (map-set tokens-by-owner tx-sender sender-tokens)
          )
          (let ((receiver-tokens (get-tokens-of new-owner)))
            (map-set tokens-by-owner new-owner (unwrap! (as-max-len? (append receiver-tokens token-id) u100) (err ERR-INVALID-UPDATE-PARAM)))
          )
          (print { event: "token-transferred", id: token-id, to: new-owner })
          (ok true)
        )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (add-milestone (token-id uint) (index uint) (description (string-utf8 256)) (achieved bool))
  (let ((token (map-get? tokens token-id)))
    (match token
      t
        (begin
          (asserts! (is-eq (get owner t) tx-sender) (err ERR-NOT-AUTHORIZED))
          (asserts! (< index (get milestone-count t)) (err ERR-INVALID-RECOVERY-MILESTONE))
          (map-set token-milestones { token-id: token-id, milestone-index: index }
            {
              description: description,
              achieved: achieved,
              timestamp: block-height
            }
          )
          (print { event: "milestone-added", token-id: token-id, index: index })
          (ok true)
        )
      (err ERR-TOKEN-NOT-FOUND)
    )
  )
)

(define-public (get-token-count)
  (ok (var-get next-token-id))
)